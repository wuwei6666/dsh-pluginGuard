import { PLUGIN_GUARD_ROUTE } from "./protocol.js";
import { createRequire } from "node:module";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
//#region src/index.ts
const name = "dsh-plugin-guard";
const inject = ["webServer", "loader"];
const NPM_DEFAULT_REGISTRY = "https://registry.npmjs.org/";
const UPDATE_CHECK_TIMEOUT_MS = 8e3;
const IMPORT_VALIDATION_TIMEOUT_MS = 15e3;
const DAMAGE_FILE = "dsh-plugin-guard-damage.json";
/** Packages that must never be auto-isolated by the guard. */
const SAFE_BUNDLES = new Set(["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", name]);
/** Resolve the user-owned profile directory managed by this plugin. */
function resolveProfileSpec(config = {}, env = process.env) {
	const profile = config.profile ?? env.DSH_PROFILE ?? "web";
	if (profile === "" || profile === "." || profile === ".." || profile.includes("/") || profile.includes("\\") || profile.includes("\0")) throw new Error(`invalid profile name: ${profile}`);
	const home = resolve(config.dshHome ?? env.DSH_HOME ?? env.dsh_home ?? join(homedir(), ".dsh"));
	const profileDir = join(home, "profiles", profile);
	const registryCandidates = resolveRegistryCandidates(config, env, profileDir, home);
	return {
		profile,
		profileDir,
		registry: registryCandidates[0] ?? NPM_DEFAULT_REGISTRY,
		registryCandidates
	};
}
function resolveRegistryCandidates(config, env, profileDir, home) {
	const configured = [
		config.registry,
		env.DSH_PLUGIN_GUARD_REGISTRY,
		env.npm_config_registry,
		env.pnpm_config_registry,
		npmrcRegistry(join(profileDir, ".npmrc")),
		npmrcRegistry(join(home, ".npmrc")),
		npmrcRegistry(join(homedir(), ".npmrc")),
		configRegistry("npm", env),
		configRegistry("pnpm", env)
	].filter((value) => typeof value === "string" && value.trim() !== "");
	return uniqueRegistries([...configured, NPM_DEFAULT_REGISTRY]);
}
function normalizeRegistry(value) {
	const trimmed = value.trim();
	return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}
function uniqueRegistries(values) {
	return [...new Set(values.map(normalizeRegistry))];
}
function npmrcRegistry(path) {
	try {
		if (!existsSync(path)) return void 0;
		const text = readFileSync(path, "utf8");
		for (const rawLine of text.split(/\r?\n/)) {
			const line = rawLine.trim();
			if (line === "" || line.startsWith("#") || line.startsWith(";")) continue;
			const match = /^registry\s*=\s*(.+)$/.exec(line);
			if (match !== null) return match[1];
		}
	} catch {}
	return void 0;
}
function configRegistry(command, env) {
	try {
		const result = spawnSync(command, [
			"config",
			"get",
			"registry"
		], {
			encoding: "utf8",
			env: {
				...process.env,
				...env
			},
			shell: process.platform === "win32",
			timeout: 5e3
		});
		if (result.status !== 0) return void 0;
		const registry = result.stdout.trim();
		return registry === "" || registry === "undefined" || registry === "null" ? void 0 : registry;
	} catch {
		return void 0;
	}
}
/** Version of this running copy, read from its own package.json. */
function selfVersion() {
	try {
		return readJson(fileURLToPath(new URL("../package.json", import.meta.url)), {}).version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}
/** Compare two semver-ish versions. Returns -1 when left < right. */
function compareVersions(left, right) {
	const a = String(left).split(/[.+-]/);
	const b = String(right).split(/[.+-]/);
	for (let index = 0; index < 3; index++) {
		const x = Number.parseInt(a[index] ?? "0", 10) || 0;
		const y = Number.parseInt(b[index] ?? "0", 10) || 0;
		if (x !== y) return x < y ? -1 : 1;
	}
	return 0;
}
function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
function sameOrigin(req) {
	if (req.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = req.headers.origin;
	if (typeof origin !== "string" || origin === "" || origin === "null") return true;
	const host = req.headers.host;
	if (typeof host !== "string" || host === "") return false;
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
function readBody(req, limit = 64 * 1024) {
	return new Promise((resolveBody, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > limit) {
				reject(new Error("body-too-large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			try {
				resolveBody(chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks.map((chunk) => typeof chunk === "string" ? Buffer.from(chunk) : chunk)).toString("utf8")));
			} catch {
				reject(new Error("invalid-json"));
			}
		});
		req.on("error", reject);
	});
}
function atomicWrite(path, text) {
	mkdirSync(dirname(path), { recursive: true });
	const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`);
	let fd;
	try {
		fd = openSync(temporary, "wx", 384);
		writeFileSync(fd, text, "utf8");
		fsyncSync(fd);
		closeSync(fd);
		fd = void 0;
		renameSync(temporary, path);
	} finally {
		if (fd !== void 0) closeSync(fd);
		if (existsSync(temporary)) rmSync(temporary, { force: true });
	}
}
function readJson(path, fallback) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return fallback;
	}
}
function writeManifest(path, manifest) {
	atomicWrite(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
function userManifest(spec) {
	mkdirSync(spec.profileDir, { recursive: true });
	return readJson(join(spec.profileDir, "package.json"), {
		name: `dsh-profile-${spec.profile}`,
		private: true,
		dsh: { profile: { bundles: [] } },
		dependencies: {}
	});
}
function normalizeManifest(manifest) {
	manifest.dependencies ??= {};
	manifest.dsh ??= {};
	manifest.dsh.profile ??= {};
	if (!Array.isArray(manifest.dsh.profile.bundles)) manifest.dsh.profile.bundles = [];
	return manifest;
}
function dependencyNames(spec) {
	const manifest = normalizeManifest(userManifest(spec));
	return new Map(Object.entries(manifest.dependencies ?? {}));
}
function damageReportPath(spec) {
	return join(spec.profileDir, DAMAGE_FILE);
}
function readDamageReports(spec) {
	const reports = readJson(damageReportPath(spec), { version: 1, damaged: {} });
	reports.damaged ??= {};
	return reports;
}
function writeDamageReports(spec, reports) {
	reports.version = 1;
	reports.damaged ??= {};
	atomicWrite(damageReportPath(spec), `${JSON.stringify(reports, null, 2)}\n`);
}
function damageFor(reports, moduleName, entryId) {
	return reports.damaged?.[moduleName] ?? Object.values(reports.damaged ?? {}).find((report) => Array.isArray(report.entryIds) && report.entryIds.includes(entryId));
}
function markDamagedPlugin(spec, moduleName, entryIds, reason) {
	const reports = readDamageReports(spec);
	reports.damaged[moduleName] = {
		moduleName,
		entryIds,
		reason,
		updatedAt: new Date().toISOString()
	};
	writeDamageReports(spec, reports);
}
function clearDamagedPlugin(spec, moduleName) {
	const reports = readDamageReports(spec);
	if (reports.damaged[moduleName] === void 0) return;
	delete reports.damaged[moduleName];
	writeDamageReports(spec, reports);
}
function phaseOf(entry) {
	if (entry.failure !== void 0) return "failed";
	const state = entry.fiber?.state;
	if (state === void 0) return null;
	return {
		0: "pending",
		1: "loading",
		2: "active",
		3: "failed",
		4: null,
		5: "unloading"
	}[state];
}
/** List runtime loader entries; never throws even if the loader API changes. */
function loaderEntries(ctx) {
	try {
		return [...ctx.loader.entries()];
	} catch {
		return [];
	}
}
function snapshot(ctx, spec) {
	const userDeps = dependencyNames(spec);
	const damaged = readDamageReports(spec);
	const plugins = [];
	const seen = new Set();
	for (const entry of loaderEntries(ctx)) {
		try {
			if (entry.options.group) continue;
			const moduleName = entry.options.name;
			// Only show plugins the user installed into the profile, never built-in/runtime ones.
			if (!userDeps.has(moduleName)) continue;
			seen.add(moduleName);
			const row = {
				entryId: entry.id,
				moduleName,
				enabled: !entry.disabled,
				phase: phaseOf(entry),
				source: "user-profile",
				removable: true
			};
			if (entry.failure !== void 0) row.failure = entry.failure.message;
			const report = damageFor(damaged, moduleName, entry.id);
			if (report !== void 0) {
				row.enabled = false;
				row.phase = "failed";
				row.failure = `damaged plugin: ${report.reason}`;
			}
			const dependencySpec = userDeps.get(moduleName);
			if (dependencySpec !== void 0) plugins.push({
				...row,
				dependencySpec
			});
			else plugins.push(row);
		} catch {}
	}
	for (const [moduleName, dependencySpec] of userDeps) {
		if (seen.has(moduleName)) continue;
		const report = damageFor(damaged, moduleName, moduleName);
		plugins.push({
			entryId: moduleName,
			moduleName,
			enabled: false,
			phase: report === void 0 ? null : "failed",
			source: "user-profile",
			removable: true,
			dependencySpec,
			...report === void 0 ? {} : { failure: `damaged plugin: ${report.reason}` }
		});
	}
	return {
		profile: spec.profile,
		profileDir: spec.profileDir,
		registry: spec.registry,
		self: {
			name,
			version: selfVersion()
		},
		plugins: plugins.sort((left, right) => Number(right.removable) - Number(left.removable) || left.moduleName.localeCompare(right.moduleName))
	};
}
const MANAGED_MARKERS = [["# --- dsh-plugin-guard managed (auto-generated; do not edit) ---", "# --- end dsh-plugin-guard managed ---"]];
const DAMAGED_MARKERS = ["# --- dsh-plugin-guard damaged (auto-generated; do not edit) ---", "# --- end dsh-plugin-guard damaged ---"];
function stripEmptyArrayDocument(text) {
	return text.split(/\r?\n/).filter((line) => line.trim() !== "[]").join("\n").trimEnd();
}
function hasYamlListItem(text) {
	return text.split(/\r?\n/).some((line) => /^\s*-\s+/.test(line));
}
function stripManagedBlocks(base, markers) {
	for (const [start, end] of markers) {
		const startIndex = base.indexOf(start);
		const endIndex = base.indexOf(end, startIndex);
		if (startIndex < 0 || endIndex < 0) continue;
		base = `${base.slice(0, startIndex).trimEnd()}\n${base.slice(endIndex + end.length).trimStart()}`;
	}
	return base;
}
function addPatchEntry(path, entryId, disabled) {
	const [markerStart, markerEnd] = MANAGED_MARKERS[0];
	let base = existsSync(path) ? readFileSync(path, "utf8") : "";
	const rows = new Map();
	for (const [start, end] of MANAGED_MARKERS) {
		const startIndex = base.indexOf(start);
		const endIndex = base.indexOf(end, startIndex);
		if (startIndex < 0 || endIndex < 0) continue;
		const matches = base.slice(startIndex, endIndex).matchAll(/- id: ([^\n]+)\n\s+disabled: (true|false)/g);
		for (const match of matches) rows.set(match[1].trim(), match[2] === "true");
		base = `${base.slice(0, startIndex).trimEnd()}\n${base.slice(endIndex + end.length).trimStart()}`;
	}
	base = stripEmptyArrayDocument(base);
	rows.set(entryId, disabled);
	const managed = [
		markerStart,
		...[...rows.entries()].map(([id, value]) => `- id: ${id}\n  disabled: ${value ? "true" : "false"}`),
		markerEnd
	].join("\n");
	atomicWrite(path, `${base.trimEnd()}${base.trim() === "" ? "" : "\n\n"}${managed}\n`);
}
/** Rewrite the auto-generated "damaged" block of cordis.patch.yml from the damage reports. */
function writeDamagePatch(spec, reports) {
	const patchPath = join(spec.profileDir, "cordis.patch.yml");
	let base = existsSync(patchPath) ? readFileSync(patchPath, "utf8") : "";
	base = stripManagedBlocks(base, [DAMAGED_MARKERS]);
	base = stripEmptyArrayDocument(base);
	const entryIds = [...new Set(Object.values(reports.damaged ?? {}).flatMap((report) => report.entryIds ?? []))];
	if (entryIds.length === 0) {
		const normalized = hasYamlListItem(base) ? base : `${base}${base.trim() === "" ? "" : "\n"}[]`;
		atomicWrite(patchPath, `${normalized.trimEnd()}\n`);
		return;
	}
	const block = [DAMAGED_MARKERS[0], ...entryIds.map((id) => `- id: ${id}\n  disabled: true`), DAMAGED_MARKERS[1]].join("\n");
	atomicWrite(patchPath, `${base.trimEnd()}${base.trim() === "" ? "" : "\n\n"}${block}\n`);
}
async function setEnabled(ctx, spec, id, enabled) {
	const entry = loaderEntries(ctx).find((candidate) => candidate.id === id || candidate.options.name === id);
	if (entry === void 0) throw new Error(`plugin not found: ${id}`);
	addPatchEntry(join(spec.profileDir, "cordis.patch.yml"), entry.id, !enabled);
	// Disabling the guard itself kills this route, so touch the loader only after the response is out.
	if (entry.options.name === name) return {
		ok: true,
		code: enabled ? "enabled" : "disabled",
		message: enabled ? "enabled" : "disabled",
		snapshot: snapshot(ctx, spec),
		afterResponse: async () => {
			await ctx.loader.update(entry.id, { disabled: enabled ? null : true });
		}
	};
	await ctx.loader.update(entry.id, { disabled: enabled ? null : true });
	return {
		ok: true,
		code: enabled ? "enabled" : "disabled",
		message: enabled ? "enabled" : "disabled",
		snapshot: snapshot(ctx, spec)
	};
}
async function runCommand(command, args, cwd) {
	return await new Promise((resolveCommand) => {
		let child;
		try {
			child = spawn(command, args, {
				cwd,
				env: {
					...process.env,
					CI: "true"
				},
				shell: process.platform === "win32"
			});
		} catch (error) {
			resolveCommand({
				ok: false,
				log: error instanceof Error ? error.message : String(error)
			});
			return;
		}
		const chunks = [];
		const collect = (chunk) => {
			chunks.push(chunk);
			let total = chunks.reduce((sum, part) => sum + part.length, 0);
			while (total > 96 * 1024 && chunks.length > 1) total -= chunks.shift().length;
		};
		child.stdout.on("data", collect);
		child.stderr.on("data", collect);
		child.on("error", (error) => {
			resolveCommand({
				ok: false,
				log: error.message
			});
		});
		child.on("close", (code) => {
			resolveCommand({
				ok: code === 0,
				log: Buffer.concat(chunks).toString("utf8")
			});
		});
	});
}
const INSTALLERS = [["pnpm", ["install", "--no-frozen-lockfile"]], ["npm", ["install", "--no-audit", "--no-fund"]]];
/** Run the profile dependency install with pnpm, falling back to npm, across candidate registries. */
async function runProfileInstall(cwd, registries) {
	const attempts = [];
	for (const [command, baseArgs] of INSTALLERS) {
		for (const registry of uniqueRegistries(registries)) {
			const args = [...baseArgs, `--registry=${registry}`];
			const result = await runCommand(command, args, cwd);
			attempts.push(`$ ${command} ${args.join(" ")}\n${result.log}`);
			if (result.ok) return {
				...result,
				registry,
				log: attempts.join("\n")
			};
		}
	}
	return {
		ok: false,
		log: attempts.join("\n")
	};
}
async function uninstall(ctx, spec, moduleName) {
	const manifestPath = join(spec.profileDir, "package.json");
	const manifest = normalizeManifest(userManifest(spec));
	if (manifest.dependencies?.[moduleName] === void 0) throw new Error(`not a user-profile plugin: ${moduleName}`);
	delete manifest.dependencies[moduleName];
	manifest.dsh.profile.bundles = manifest.dsh.profile.bundles.filter((bundle) => bundle !== moduleName);
	writeManifest(manifestPath, manifest);
	clearDamagedPlugin(spec, moduleName);
	writeDamagePatch(spec, readDamageReports(spec));
	rmSync(join(spec.profileDir, "node_modules", ...moduleName.split("/")), {
		recursive: true,
		force: true
	});
	// Removing the guard itself kills this route, so touch the loader only after the response is out.
	const entry = loaderEntries(ctx).find((candidate) => candidate.options.name === moduleName);
	let afterResponse;
	if (entry !== void 0) {
		if (entry.options.name === name) afterResponse = async () => {
			await ctx.loader.remove(entry.id);
		};
		else try {
			await ctx.loader.remove(entry.id);
		} catch {}
	}
	const install = await runProfileInstall(spec.profileDir, spec.registryCandidates);
	const result = {
		ok: install.ok,
		code: install.ok ? "uninstalled" : "uninstall-install-failed",
		message: install.ok ? "uninstalled" : "uninstalled from manifest; dependency install failed",
		snapshot: snapshot(ctx, spec),
		log: install.log
	};
	if (afterResponse !== void 0) result.afterResponse = afterResponse;
	return result;
}
/** Run deferred loader work (self disable/uninstall) after the response has been sent. */
function runAfterResponse(result) {
	if (typeof result?.afterResponse !== "function") return;
	setTimeout(() => {
		Promise.resolve(result.afterResponse()).catch(() => {});
	}, 300);
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
		const entryName = /^\s+name:\s*(.+?)\s*$/.exec(line);
		if (entryName !== null && current !== void 0) current.name = stripYaml(entryName[1]);
	}
	return entries.filter((entry) => entry.id || entry.name);
}
function packageDirOf(spec, moduleName) {
	const dependencySpec = readJson(join(spec.profileDir, "package.json"), {}).dependencies?.[moduleName];
	if (typeof dependencySpec === "string" && dependencySpec.startsWith("file:")) {
		const filePath = dependencySpec.slice(5).replace(/\//g, process.platform === "win32" ? "\\" : "/");
		const resolved = resolve(spec.profileDir, filePath);
		if (existsSync(join(resolved, "package.json"))) return resolved;
	}
	const installed = join(spec.profileDir, "node_modules", ...moduleName.split("/"));
	if (existsSync(join(installed, "package.json"))) return installed;
}
function bundlePatchText(dir, manifest) {
	const patch = manifest.dsh?.bundle?.patch;
	if (typeof patch !== "string" || patch.trim() === "") return "";
	const patchPath = resolve(dir, patch);
	return existsSync(patchPath) ? readFileSync(patchPath, "utf8") : "";
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
/** Import a module but never wait forever for a broken top-level await. */
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
/** Try importing every bundle entry of a user plugin; report the first failure. */
async function validateBundle(spec, moduleName) {
	const dir = packageDirOf(spec, moduleName);
	if (dir === void 0) return {
		ok: false,
		entryIds: [],
		reason: "plugin directory missing or package.json is not parseable"
	};
	const manifest = readJson(join(dir, "package.json"), {});
	const entries = parsePatchEntries(bundlePatchText(dir, manifest));
	const packageRequire = createRequire(join(dir, "package.json"));
	for (const entry of entries) {
		const importName = entry.name ?? moduleName;
		if (importName.startsWith("cordis:")) continue;
		try {
			const resolvedImport = importName === moduleName ? packageEntrypoint(dir, manifest) : packageRequire.resolve(importName);
			await importWithTimeout(pathToFileURL(resolvedImport).href);
		} catch (error) {
			return {
				ok: false,
				entryIds: entries.map((item) => item.id).filter(Boolean),
				reason: `${importName} failed to import: ${error instanceof Error ? error.message : String(error)}`
			};
		}
	}
	return {
		ok: true,
		entryIds: entries.map((entry) => entry.id).filter(Boolean),
		reason: ""
	};
}
/**
 * Scan every user-installed bundle, isolate the ones that fail to import, and
 * keep them out of the boot bundles so the next web start stays healthy.
 */
async function scan(ctx, spec) {
	const manifestPath = join(spec.profileDir, "package.json");
	const manifest = normalizeManifest(userManifest(spec));
	const reports = readDamageReports(spec);
	const bundles = manifest.dsh.profile.bundles;
	const nextBundles = [];
	const isolated = [];
	const healthy = [];
	for (const bundle of bundles) {
		if (SAFE_BUNDLES.has(bundle) || manifest.dependencies?.[bundle] === void 0) {
			nextBundles.push(bundle);
			continue;
		}
		const result = await validateBundle(spec, bundle);
		if (result.ok) {
			if (reports.damaged[bundle] !== void 0) delete reports.damaged[bundle];
			healthy.push(bundle);
			nextBundles.push(bundle);
			continue;
		}
		isolated.push(bundle);
		reports.damaged[bundle] = {
			moduleName: bundle,
			entryIds: result.entryIds,
			reason: result.reason,
			updatedAt: new Date().toISOString()
		};
		// Best effort: also disable the live entry so the broken code stops running now.
		const entry = loaderEntries(ctx).find((candidate) => candidate.options.name === bundle);
		if (entry !== void 0) try {
			await ctx.loader.update(entry.id, { disabled: true });
		} catch {}
	}
	manifest.dsh.profile.bundles = nextBundles;
	writeManifest(manifestPath, manifest);
	writeDamageReports(spec, reports);
	writeDamagePatch(spec, reports);
	return {
		ok: true,
		code: isolated.length === 0 ? "scan-none" : "scan-isolated",
		count: isolated.length,
		message: isolated.length === 0 ? "scan complete: no damaged plugins found" : `scan complete: isolated ${isolated.length} damaged plugin(s)`,
		isolated,
		healthy,
		snapshot: snapshot(ctx, spec)
	};
}
/** Ask an npm registry for the latest published version of this plugin.
 * Returns the version string, null when the package is not published (404),
 * and throws on real network/registry failures. */
async function fetchLatestVersion(registry) {
	if (typeof fetch !== "function") throw new Error("fetch is not available in this runtime");
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), UPDATE_CHECK_TIMEOUT_MS);
	try {
		const response = await fetch(new URL(`${name}/latest`, registry), {
			signal: controller.signal,
			headers: { accept: "application/json" }
		});
		if (response.status === 404) return null;
		if (!response.ok) throw new Error(`registry responded ${response.status}`);
		const body = await response.json();
		if (typeof body?.version !== "string" || body.version.trim() === "") throw new Error("registry returned an invalid version");
		return body.version.trim();
	} finally {
		clearTimeout(timer);
	}
}
/** Check npm for a newer version of this plugin. Never throws. */
async function checkUpdate(spec) {
	const current = selfVersion();
	let sawNotPublished = false;
	for (const registry of spec.registryCandidates) {
		try {
			const latest = await fetchLatestVersion(registry);
			if (latest === null) {
				sawNotPublished = true;
				continue;
			}
			return {
				ok: true,
				current,
				latest,
				updateAvailable: compareVersions(current, latest) < 0,
				registry
			};
		} catch {}
	}
	// 404 everywhere means the package simply is not published yet — stay silent.
	if (sawNotPublished) return {
		ok: true,
		code: "not-published",
		current,
		updateAvailable: false
	};
	return {
		ok: false,
		code: "registry-unreachable",
		current,
		message: "could not reach any npm registry to check for updates"
	};
}
/** Update this plugin in place by bumping the profile dependency and reinstalling. */
async function selfUpdate(spec) {
	const check = await checkUpdate(spec);
	if (!check.ok) return {
		ok: false,
		code: check.code ?? "update-check-failed",
		message: check.message ?? "update check failed",
		current: check.current
	};
	if (!check.updateAvailable) return {
		ok: true,
		code: "already-latest",
		current: check.current,
		latest: check.latest,
		updateAvailable: false,
		message: "already up to date"
	};
	const manifestPath = join(spec.profileDir, "package.json");
	const manifest = normalizeManifest(userManifest(spec));
	if (manifest.dependencies[name] === void 0) return {
		ok: false,
		code: "not-profile-installed",
		current: check.current,
		latest: check.latest,
		message: "this plugin is not installed as a profile dependency; cannot self-update"
	};
	manifest.dependencies[name] = `^${check.latest}`;
	writeManifest(manifestPath, manifest);
	const install = await runProfileInstall(spec.profileDir, [check.registry, ...spec.registryCandidates]);
	return {
		ok: install.ok,
		code: install.ok ? "updated" : "update-install-failed",
		current: check.current,
		latest: check.latest,
		updateAvailable: true,
		message: install.ok ? `updated to ${check.latest}; restart the dsh web client to finish` : "new version written to the manifest, but the dependency install failed",
		log: install.log
	};
}
function methodPath(req) {
	return new URL(req.url ?? "/", "http://localhost").pathname;
}
/** Create the same-origin route used by the browser tab. */
function makePluginGuardRoute(ctx, config = {}) {
	const spec = resolveProfileSpec(config);
	return {
		kind: "exact",
		path: PLUGIN_GUARD_ROUTE,
		async handler(req, res) {
			if (!sameOrigin(req)) {
				json(res, 403, {
					ok: false,
					message: "cross-site request rejected"
				});
				return;
			}
			try {
				if (req.method === "GET") {
					json(res, 200, {
						ok: true,
						snapshot: snapshot(ctx, spec)
					});
					return;
				}
				if (req.method === "POST") {
					const body = await readBody(req);
					const action = typeof body === "object" && body !== null ? body.action : void 0;
					if (action === "enable" || action === "disable") {
						const result = await setEnabled(ctx, spec, String(body.id ?? ""), action === "enable");
						json(res, 200, result);
						runAfterResponse(result);
						return;
					}
					if (action === "uninstall") {
						const result = await uninstall(ctx, spec, String(body.moduleName ?? ""));
						json(res, 200, result);
						runAfterResponse(result);
						return;
					}
					if (action === "scan") {
						json(res, 200, await scan(ctx, spec));
						return;
					}
					if (action === "check-update") {
						json(res, 200, await checkUpdate(spec));
						return;
					}
					if (action === "self-update") {
						json(res, 200, await selfUpdate(spec));
						return;
					}
				}
				json(res, 405, {
					ok: false,
					message: `method not allowed: ${methodPath(req)}`
				});
			} catch (error) {
				json(res, 400, {
					ok: false,
					message: error instanceof Error ? error.message : String(error)
				});
			}
		}
	};
}
/**
 * Register the plugin guard route. Every failure is swallowed: at worst this
 * plugin stays unusable, it must never take the web client down with it.
 */
function apply(ctx, config = {}) {
	try {
		ctx.effect(() => {
			try {
				return ctx.webServer.register(makePluginGuardRoute(ctx, config));
			} catch (error) {
				console.error(`[dsh-plugin-guard] route registration failed: ${error instanceof Error ? error.message : String(error)}`);
				return void 0;
			}
		}, "dsh-plugin-guard: route");
	} catch (error) {
		console.error(`[dsh-plugin-guard] apply failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}
//#endregion
export { PLUGIN_GUARD_ROUTE, apply, checkUpdate, inject, makePluginGuardRoute, name, resolveProfileSpec, scan, selfUpdate };
