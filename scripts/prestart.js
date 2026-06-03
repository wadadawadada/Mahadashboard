#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const PYTHON_CANDIDATES = ["python", "python3", "py"];

function tryPython(bin) {
  const result = spawnSync(bin, ["--version"], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0 || result.error) return null;
  const version = (result.stdout || result.stderr || "").trim();
  const match = version.match(/Python (\d+)\.(\d+)/);
  if (!match) return null;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  if (major < 3 || (major === 3 && minor < 10)) return null;
  return { bin, version };
}

function findPython() {
  for (const candidate of PYTHON_CANDIDATES) {
    const found = tryPython(candidate);
    if (found) return found;
  }
  return null;
}

const python = findPython();

if (!python) {
  console.error(`
  ERROR: Python 3.10+ was not found.

  Please install Python from https://www.python.org/downloads/
  and then run:  npm install

`);
  process.exit(1);
}

// Quick smoke-test: try importing a key dependency
const test = spawnSync(python.bin, ["-c", "import swisseph, pydantic, timezonefinder"], {
  cwd: ROOT,
  encoding: "utf8",
  windowsHide: true,
});

if (test.status !== 0) {
  console.error(`
  ERROR: Python dependencies are not installed.

  Please run:  npm install

  This will automatically install all required Python packages.
`);
  process.exit(1);
}
