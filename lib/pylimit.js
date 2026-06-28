"use strict";

// In-process counting semaphore bounding concurrent Python subprocesses.
// Stdlib-only (TC1): no external concurrency libraries.

const os = require("os");

function createSemaphore(max) {
  const limit = Math.max(1, Number(max) || 1);
  let active = 0;
  const queue = [];

  function pump() {
    while (active < limit && queue.length > 0) {
      active++;
      const { task, resolve, reject } = queue.shift();
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          active--;
          pump();
        });
    }
  }

  /**
   * Acquire a slot, run `task` (a function returning a promise), release the
   * slot when it settles. Resolves/rejects with `task`'s result/error.
   */
  function run(task) {
    return new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      pump();
    });
  }

  return {
    run,
    get active() {
      return active;
    },
    get pending() {
      return queue.length;
    },
    limit,
  };
}

const MAX_CONCURRENCY = Math.max(
  1,
  Number(process.env.PY_MAX_CONCURRENCY) || (os.cpus() || []).length || 1,
);

const _default = createSemaphore(MAX_CONCURRENCY);

module.exports = {
  createSemaphore,
  runPyLimited: (task) => _default.run(task),
  MAX_CONCURRENCY,
};
