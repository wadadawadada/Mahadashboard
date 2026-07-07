"use strict";

// Atomic JSON writes + per-path serialization for concurrent mutations.
// Stdlib-only (TC1): no external lock libraries.

const fsp = require("fs/promises");
const path = require("path");

/**
 * Write JSON to `filePath` atomically: serialize to a sibling temp file in the
 * same directory, then `rename` into place. A crash mid-write leaves the
 * original file intact (rename is atomic on the same filesystem).
 */
async function writeJsonAtomic(filePath, value) {
  const dir = path.dirname(filePath);
  await fsp.mkdir(dir, { recursive: true });
  const tmpPath = path.join(
    dir,
    `${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  try {
    await fsp.writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await fsp.rename(tmpPath, filePath);
  } catch (error) {
    await fsp.rm(tmpPath, { force: true }).catch(() => {});
    throw error;
  }
}

// Per-path promise-chain mutex. Keyed by resolved absolute path so two callers
// targeting the same file are serialized regardless of how they spelled it.
const _locks = new Map();

/**
 * Run `fn` while holding an exclusive in-process lock for `filePath`. Concurrent
 * callers for the same path run strictly one-at-a-time (FIFO); different paths
 * proceed in parallel. The returned promise settles with `fn`'s result/error.
 */
function withFileLock(filePath, fn) {
  const key = path.resolve(filePath);
  const prev = _locks.get(key) || Promise.resolve();
  // Run `fn` after the previous holder settles, whatever its outcome.
  const run = prev.then(() => fn(), () => fn());
  // The chain tail swallows errors so one failure does not poison the queue.
  const tail = run.then(() => {}, () => {});
  _locks.set(key, tail);
  // Drop the map entry once the queue drains, to avoid unbounded growth.
  tail.then(() => {
    if (_locks.get(key) === tail) _locks.delete(key);
  });
  return run;
}

module.exports = { writeJsonAtomic, withFileLock };
