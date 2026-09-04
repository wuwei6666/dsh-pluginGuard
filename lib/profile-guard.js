#!/usr/bin/env node
// dsh-plugin-guard standalone profile guard.
//
// Run this BEFORE starting the dsh web client (e.g. `node profile-guard.js`,
// or `dsh plugin guard` integrations). It scans user-installed bundles in the
// profile, and any plugin whose entry fails to import is removed from the boot
// bundles and disabled via cordis.patch.yml — so a broken plugin can never
// take the web client down. Safe bundles (the web app itself and this guard)
// are never touched.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SELF_NAME = "dsh-plugin-guard";
const IMPORT_VALIDATION_TIMEOUT_MS = 15e3;
const profileName = process.env.DSH_PROFILE || "web";
const dshHome = resolve(process.env.DSH_HOME || process.env.dsh_home || join(homedir(), ".dsh"));
const profileDir = join(dshHome, "profiles", profileName);
const manifestPath = join(profileDir, "package.json");
const patchPath = join(profileDir, "cordis.patch.yml");
const damagePath = join(profileDir, "dsh-plugin-guard-damage.json");
const safeBundles = new Set([
	"@deepseek-ai/dsh-base",
	"@deepseek-ai/dsh-web-app",
	SELF_NAME
]);

function readJson(path, fallback) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return fallback;
	}
}

function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeManifest(manifest) {
	manifest.dependencies ??= {};
	manifest.dsh ??= {};
	manifest.dsh.profile ??= {};
	if (!Array.isArray(manifest.dsh.profile.bundles)) manifest.dsh.profile.bundles = [];
	return manifest;
}

function stripYaml(value) {
	return value.trim().replace(/^['"]|['"]$/g, "");
}

function parsePatchEntries(text) {
	const entries = [];
	let current;
	for (const line of text.split(/\r?\n/)) {
		const id = /^\s*-\s+id:\s*(.+?)\s*$/.exec(line);
		if (id !== null) {
			current = { id: stripYaml(id[1]) };
			entries.push(current);
			continue;
		}
		const name = /^\s+name:\s*(.+?)\s*$/.exec(line);
		if (name !== null && current !== void 0) current.name = stripYaml(name[1]);
	}
	return entries.filter((entry) => entry.id || entry.name);
}

function packageDir(moduleName) {
	const dependencySpec = readJson(manifestPath, {}).dependencies?.[moduleName];
	if (typeof dependencySpec === "string" && dependencySpec.startsWith("file:")) {
		const filePath = dependencySpec.slice(5).replace(/\//g, process.platform === "win32" ? "\\" : "/");
		const resolved = resolve(profileDir, filePath);
		if (existsSync(join(resolved, "package.json"))) return resolved;
	}
	const installed = join(profileDir, "node_modules", ...moduleName.split("/"));
	if (existsSync(join(installed, "package.json"))) return installed;
}

function bundlePatchText(dir, manifest) {
	const patch = manifest.dsh?.bundle?.patch;
	if (typeof patch !== "string" || patch.trim() === "") return "";
	const fullPath = resolve(dir, patch);
	return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function packageEntrypoint(dir, manifest) {
	const candidates = [
		typeof manifest.module === "string" ? manifest.module : void 0,
		typeof manifest.main === "string" ? manifest.main : void 0,
		"index.js"
	].filter(Boolean);
	for (const candidate of candidates) {
		const fullPath = resolve(dir, candidate);
		if (existsSync(fullPath)) return fullPath;
	}
	return resolve(dir, candidates[0] || "index.js");
}

function resolveImport(importName, moduleName, dir, manifest, req) {
	if (importName === moduleName) return packageEntrypoint(dir, manifest);
	return req.resolve(importName);
}

async function importWithTimeout(href) {
	let timer;
	try {
		return await Promise.race([import(href), new Promise((_, reject) => {
			timer = setTimeout(() => reject(new Error("import timed out")), IMPORT_VALIDATION_TIMEOUT_MS);
		})]);
	} finally {
		clearTimeout(timer);
	}
}

async function validateBundle(moduleName) {
	const dir = packageDir(moduleName);
	if (dir === void 0) return { ok: false, entryIds: [], reason: "plugin directory missing or package.json is not parseable" };
	const manifest = readJson(join(dir, "package.json"), {});
	const entries = parsePatchEntries(bundlePatchText(dir, manifest));
	const req = createRequire(join(dir, "package.json"));
	for (const entry of entries) {
		const importName = entry.name || moduleName;
		if (importName.startsWith("cordis:")) continue;
		try {
			const resolved = resolveImport(importName, moduleName, dir, manifest, req);
			await importWithTimeout(pathToFileURL(resolved).href);
		} catch (error) {
			return {
				ok: false,
				entryIds: entries.map((item) => item.id).filter(Boolean),
				reason: `${importName} failed to import: ${error instanceof Error ? error.message : String(error)}`
			};
		}
	}
	return { ok: true, entryIds: entries.map((entry) => entry.id).filter(Boolean), reason: "" };
}

function stripEmptyArrayDocument(text) {
	return text.split(/\r?\n/).filter((line) => line.trim() !== "[]").join("\n").trimEnd();
}

function hasYamlListItem(text) {
	return text.split(/\r?\n/).some((line) => /^\s*-\s+/.test(line));
}

function writeDamagePatch(reports) {
	const start = "# --- dsh-plugin-guard damaged (auto-generated; do not edit) ---";
	const end = "# --- end dsh-plugin-guard damaged ---";
	let base = existsSync(patchPath) ? readFileSync(patchPath, "utf8") : "";
	const startIndex = base.indexOf(start);
	if (startIndex >= 0) {
		const endIndex = base.indexOf(end, startIndex);
		if (endIndex >= 0) base = `${base.slice(0, startIndex).trimEnd()}\n${base.slice(endIndex + end.length).trimStart()}`;
	}
	base = stripEmptyArrayDocument(base);
	const entryIds = [...new Set(Object.values(reports.damaged ?? {}).flatMap((report) => report.entryIds ?? []))];
	if (entryIds.length === 0) {
		const normalized = hasYamlListItem(base) ? base : `${base}${base.trim() === "" ? "" : "\n"}[]`;
		writeFileSync(patchPath, `${normalized.trimEnd()}\n`, "utf8");
		return;
	}
	const block = [start, ...entryIds.map((id) => `- id: ${id}\n  disabled: true`), end].join("\n");
	writeFileSync(patchPath, `${base.trimEnd()}${base.trim() === "" ? "" : "\n\n"}${block}\n`, "utf8");
}

async function main() {
	if (!existsSync(manifestPath)) return 0;
	const manifest = normalizeManifest(readJson(manifestPath, {}));
	const reports = readJson(damagePath, { version: 1, damaged: {} });
	reports.version = 1;
	reports.damaged ??= {};
	const nextBundles = [];
	let changed = false;
	for (const bundle of manifest.dsh.profile.bundles) {
		if (safeBundles.has(bundle) || manifest.dependencies?.[bundle] === void 0) {
			nextBundles.push(bundle);
			continue;
		}
		const result = await validateBundle(bundle);
		if (result.ok) {
			delete reports.damaged[bundle];
			nextBundles.push(bundle);
			continue;
		}
		changed = true;
		reports.damaged[bundle] = {
			moduleName: bundle,
			entryIds: result.entryIds,
			reason: result.reason,
			updatedAt: new Date().toISOString()
		};
		console.log(`[dsh-plugin-guard] Disabled damaged plugin: ${bundle}`);
		console.log(`[dsh-plugin-guard] ${result.reason}`);
	}
	if (changed) {
		manifest.dsh.profile.bundles = nextBundles;
		writeJson(manifestPath, manifest);
	}
	writeJson(damagePath, reports);
	writeDamagePatch(reports);
	return 0;
}

main().then((code) => process.exit(code), (error) => {
	console.error(`[dsh-plugin-guard] profile guard failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
	process.exit(1);
});
