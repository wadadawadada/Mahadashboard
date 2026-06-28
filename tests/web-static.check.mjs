import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 7986;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const require = createRequire(import.meta.url);
const { startServer } = require(path.join(ROOT, "server.js"));

function ok(name) {
  console.log(`ok - ${name}`);
}

async function run() {
  const server = await startServer({ port: PORT, openBrowser: false, log: false });
  try {
    const chartResponse = await fetch(`${BASE_URL}/chart3d.mjs`);
    assert.equal(chartResponse.status, 200);
    assert.match(chartResponse.headers.get("content-type") || "", /application\/javascript/i);
    // S6.1: static assets are now streamed with a revalidatable cache header
    // (no longer no-store).
    assert.doesNotMatch(chartResponse.headers.get("cache-control") || "", /no-store/i);
    assert.match(chartResponse.headers.get("cache-control") || "", /max-age|must-revalidate/i);
    const chartBody = await chartResponse.text();
    // chart3d.mjs uses the importmap alias "three" (resolved to /vendor/three.module.js by index.html)
    assert.match(chartBody, /from "three"/);
    ok("serves chart3d module locally with JS MIME");

    const vendorResponse = await fetch(`${BASE_URL}/vendor/three.module.js`);
    assert.equal(vendorResponse.status, 200);
    assert.match(vendorResponse.headers.get("content-type") || "", /application\/javascript/i);
    const vendorBody = await vendorResponse.text();
    assert.match(vendorBody, /Copyright 2010-20\d{2} Three\.js Authors/);
    assert.match(vendorBody, /from '\.\/three\.core\.js'/);
    ok("serves local three vendor module");

    const vendorCoreResponse = await fetch(`${BASE_URL}/vendor/three.core.js`);
    assert.equal(vendorCoreResponse.status, 200);
    assert.match(vendorCoreResponse.headers.get("content-type") || "", /application\/javascript/i);
    const vendorCoreBody = await vendorCoreResponse.text();
    assert.match(vendorCoreBody, /Copyright 2010-20\d{2} Three\.js Authors/);
    ok("serves local three core dependency");

    const appResponse = await fetch(`${BASE_URL}/app.js`);
    assert.equal(appResponse.status, 200);
    const appBody = await appResponse.text();
    assert.match(appBody, /\/chart3d\.mjs/);
    assert.doesNotMatch(appBody, /https?:\/\/localhost:\d+\/chart3d\.mjs/);
    ok("app entry references local 3D module path");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run()
  .then(() => {
    console.log("web-static checks passed");
  })
  .catch((error) => {
    console.error("web-static checks failed");
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
