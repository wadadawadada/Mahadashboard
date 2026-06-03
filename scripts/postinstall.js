#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const REQUIREMENTS = path.join(ROOT, "requirements.txt");

const PYTHON_CANDIDATES = [
  "python",
  "python3",
  "py",
];

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

function installPythonDeps(pythonBin) {
  console.log(`\n  Installing Python dependencies via pip...`);
  const result = spawnSync(
    pythonBin,
    ["-m", "pip", "install", "-r", REQUIREMENTS, "--quiet"],
    { cwd: ROOT, encoding: "utf8", stdio: "inherit", windowsHide: true }
  );
  if (result.error) {
    throw new Error(`pip failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`pip exited with code ${result.status}`);
  }
}

console.log("\n=== Jyotish Setup ===");

const python = findPython();

if (!python) {
  console.error(`
  ERROR: Python 3.10+ was not found on your system.

  Please install Python from https://www.python.org/downloads/
  Make sure to check "Add Python to PATH" during installation.

  After installing Python, run:  npm install

`);
  process.exit(1);
}

console.log(`  Python found: ${python.version} (${python.bin})`);

try {
  installPythonDeps(python.bin);
  console.log(`  Python dependencies installed successfully.\n`);
} catch (err) {
  console.error(`\n  ERROR: Failed to install Python dependencies.\n  ${err.message}\n`);
  process.exit(1);
}
