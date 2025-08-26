// src/utils/optimistic.js
export function withOptimistic(list, optimisticItem, commitFn, replaceKey = '_id') {
    // Returns: { listNext, commit: Promise }
    const listNext = [optimisticItem, ...list];
    const commit = commitFn()
      .then((real) => (prev) =>
        prev.map((it) => (it[replaceKey] === optimisticItem[replaceKey] ? real : it))
      )
      .catch((err) => {
        // rollback
        return (prev) => prev.filter((it) => it[replaceKey] !== optimisticItem[replaceKey]);
      });
    return { listNext, commit };
  }
  