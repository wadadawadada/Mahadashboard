import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 7991;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EXPORT_RUN_ID = "11111111-1111-4111-8111-111111111111";
const EXPORT_RUN_DIR = path.join(ROOT, "data", "service", "runs", EXPORT_RUN_ID);
const require = createRequire(import.meta.url);
const { startServer } = require(path.join(ROOT, "server.js"));

function ok(name) {
  console.log(`ok - ${name}`);
}

async function seedExportRun() {
  const reportsDir = path.join(ROOT, "data", "reports");
  const [chart, context, report] = await Promise.all([
    fs.readFile(path.join(reportsDir, "latest.chart.json"), "utf8"),
    fs.readFile(path.join(reportsDir, "latest.context.json"), "utf8"),
    fs.readFile(path.join(reportsDir, "latest.report.md"), "utf8"),
  ]);

  const manifest = JSON.stringify(
    {
      id: EXPORT_RUN_ID,
      created_at: "2026-01-01T00:00:00.000Z",
      summary: { name: "Export test" },
      files: {},
    },
    null,
    2
  );

  await fs.mkdir(EXPORT_RUN_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(EXPORT_RUN_DIR, "manifest.json"), manifest, "utf8"),
    fs.writeFile(path.join(EXPORT_RUN_DIR, "chart.json"), chart, "utf8"),
    fs.writeFile(path.join(EXPORT_RUN_DIR, "context.json"), context, "utf8"),
    fs.writeFile(path.join(EXPORT_RUN_DIR, "report.md"), report, "utf8"),
  ]);
}

async function run() {
  await seedExportRun();
  const server = await startServer({ port: PORT, openBrowser: false, log: false });
  try {
    const exportResponse = await fetch(`${BASE_URL}/api/export/${EXPORT_RUN_ID}?lang=en`);
    assert.equal(exportResponse.status, 200);
    assert.match(exportResponse.headers.get("content-type") || "", /text\/markdown/i);
    assert.match(exportResponse.headers.get("content-disposition") || "", /attachment; filename="Serg_astro_report\.md"/);
    const exportBody = await exportResponse.text();
    assert.match(exportBody, /^# Astro report: Serg$/m);
    assert.match(exportBody, /\| Planet \| Aries \| Taurus \| Gemini \|/);
    ok("export endpoint returns markdown attachment");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run()
  .then(() => {
    console.log("export checks passed");
  })
  .catch((error) => {
    console.error("export checks failed");
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
