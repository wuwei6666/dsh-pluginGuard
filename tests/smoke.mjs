// Smoke test for dsh-plugin-guard. Runs fully offline against a temporary
// DSH_HOME fixture: no server, no network, no dsh install required.
//
//   npm test
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { Readable } from "node:stream";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import { makePluginGuardRoute } from "../lib/index.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function makeRes() {
  return {
    status: 0, body: "", headersSent: false,
    writeHead(s) { this.status = s; this.headersSent = true; },
    write(c) { this.body += c; }, end(c) { if (c) this.body += c; },
    json() { return JSON.parse(this.body); }
  };
}
function post(route, payload) {
  const req = Readable.from([Buffer.from(JSON.stringify(payload))]);
  req.method = "POST"; req.url = route.path; req.headers = { host: "localhost" };
  return req;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fixture() {
  const home = mkdtempSync(join(tmpdir(), "dsh-plugin-guard-test-"));
  const profileDir = join(home, "profiles", "web");
  mkdirSync(profileDir, { recursive: true });
  const pluginsRoot = join(home, "plugins");
  const make = (name, broken) => {
    mkdirSync(join(pluginsRoot, name), { recursive: true });
    writeFileSync(join(pluginsRoot, name, "package.json"), JSON.stringify({
      name, version: "1.0.0", main: "index.js", type: "module",
      dsh: { bundle: { patch: "./cordis.patch.yml" } }
    }));
    writeFileSync(join(pluginsRoot, name, "index.js"), broken ? `throw new Error("boom");\n` : "export {};\n");
    writeFileSync(join(pluginsRoot, name, "cordis.patch.yml"), `- insert:\n    - id: ${name}\n      name: '${name}'\n`);
  };
  make("broken-plugin", true);
  make("good-plugin", false);
  writeFileSync(join(profileDir, "package.json"), JSON.stringify({
    name: "dsh-profile-web", private: true,
    dependencies: {
      "dsh-plugin-guard": "0.1.0",
      "broken-plugin": `file:${join(pluginsRoot, "broken-plugin")}`,
      "good-plugin": `file:${join(pluginsRoot, "good-plugin")}`
    },
    dsh: { profile: { bundles: ["dsh-plugin-guard", "broken-plugin", "good-plugin"] } }
  }, null, 2));
  return { home, profileDir };
}

function fakeCtx() {
  const loaderCalls = [];
  const ctx = {
    loader: {
      entries: () => [
        { id: "include:broken-plugin", options: { name: "broken-plugin" }, disabled: false, fiber: { state: 2 } },
        { id: "include:good-plugin", options: { name: "good-plugin" }, disabled: false, fiber: { state: 2 } },
        { id: "include:dsh-plugin-guard", options: { name: "dsh-plugin-guard" }, disabled: false, fiber: { state: 2 } },
        { id: "internal", options: { name: "@deepseek-ai/dsh-base", group: "builtin" }, disabled: false }
      ],
      update: async (id, patch) => { loaderCalls.push(["update", id, patch]); },
      remove: async (id) => { loaderCalls.push(["remove", id]); }
    },
    webServer: { register: (r) => r }
  };
  return { ctx, loaderCalls };
}

// Phase A: snapshot, scan & isolate, enable/disable.
{
  const { home, profileDir } = fixture();
  const { ctx } = fakeCtx();
  const route = makePluginGuardRoute(ctx, { dshHome: home, profile: "web", registry: "https://registry.npmjs.org/" });
  assert.equal(route.path, "/api/dsh/plugin-guard");

  const res = makeRes();
  await route.handler({ method: "GET", url: route.path, headers: { host: "localhost" } }, res);
  const body = res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.snapshot.plugins.map((p) => p.moduleName).sort(), ["broken-plugin", "dsh-plugin-guard", "good-plugin"]);

  const scanRes = makeRes();
  await route.handler(post(route, { action: "scan" }), scanRes);
  const scan = scanRes.json();
  assert.equal(scan.ok, true);
  assert.deepEqual(scan.isolated, ["broken-plugin"]);
  assert.deepEqual(scan.healthy, ["good-plugin"]);
  const manifest = JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"));
  assert.deepEqual(manifest.dsh.profile.bundles, ["dsh-plugin-guard", "good-plugin"]);
  const damage = JSON.parse(readFileSync(join(profileDir, "dsh-plugin-guard-damage.json"), "utf8"));
  assert.ok(damage.damaged["broken-plugin"].reason.includes("boom"));
  assert.ok(readFileSync(join(profileDir, "cordis.patch.yml"), "utf8").includes("- id: broken-plugin"));
  console.log("ok - scan isolates damaged plugins");

  const disRes = makeRes();
  await route.handler(post(route, { action: "disable", id: "include:good-plugin" }), disRes);
  assert.equal(disRes.json().ok, true);
  assert.ok(readFileSync(join(profileDir, "cordis.patch.yml"), "utf8").includes("- id: include:good-plugin"));
  console.log("ok - disable writes cordis.patch.yml");

  // standalone profile-guard.js repairs a re-broken profile
  manifest.dsh.profile.bundles = ["dsh-plugin-guard", "broken-plugin", "good-plugin"];
  writeFileSync(join(profileDir, "package.json"), JSON.stringify(manifest, null, 2));
  const run = spawnSync(process.execPath, [join(repoRoot, "lib", "profile-guard.js")], { env: { ...process.env, DSH_HOME: home }, encoding: "utf8" });
  assert.equal(run.status, 0);
  const repaired = JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"));
  assert.deepEqual(repaired.dsh.profile.bundles, ["dsh-plugin-guard", "good-plugin"]);
  console.log("ok - standalone profile-guard.js repairs the profile");
}

// Phase B: the guard can disable/uninstall itself; loader work is deferred
// until after the response so the route never dies mid-request.
{
  const home = mkdtempSync(join(tmpdir(), "dsh-plugin-guard-self-"));
  const profileDir = join(home, "profiles", "web");
  mkdirSync(profileDir, { recursive: true });
  writeFileSync(join(profileDir, "package.json"), JSON.stringify({
    name: "dsh-profile-web", private: true,
    dependencies: { "dsh-plugin-guard": "0.1.0" },
    dsh: { profile: { bundles: ["dsh-plugin-guard"] } }
  }, null, 2));
  const { ctx, loaderCalls } = fakeCtx();
  const route = makePluginGuardRoute(ctx, { dshHome: home, profile: "web", registry: "https://registry.npmjs.org/" });

  const res = makeRes();
  await route.handler(post(route, { action: "disable", id: "include:dsh-plugin-guard" }), res);
  assert.equal(res.json().ok, true);
  assert.deepEqual(loaderCalls, []); // deferred
  await sleep(600);
  assert.deepEqual(loaderCalls, [["update", "include:dsh-plugin-guard", { disabled: true }]]);
  console.log("ok - self disable responds first, loader update deferred");

  loaderCalls.length = 0;
  const rmRes = makeRes();
  await route.handler(post(route, { action: "uninstall", moduleName: "dsh-plugin-guard" }), rmRes);
  assert.equal(rmRes.json().message.includes("uninstalled"), true);
  await sleep(600);
  assert.deepEqual(loaderCalls, [["remove", "include:dsh-plugin-guard"]]);
  const manifest = JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"));
  assert.equal(manifest.dependencies["dsh-plugin-guard"], undefined);
  assert.deepEqual(manifest.dsh.profile.bundles, []);
  console.log("ok - self uninstall updates the manifest, loader remove deferred");
}

console.log("smoke test passed");
