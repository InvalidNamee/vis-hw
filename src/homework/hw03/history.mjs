/** Preserve full operation chains when editing an earlier step or switching branches. */
export function preserveBranch(branches, operations, cursor, name, id) {
  return [...branches, { id, name, operations: structuredClone(operations), cursor }];
}
export function forkHistory(branches, operations, cursor, from, name, id) {
  if (!Number.isInteger(from) || from < 0 || from > operations.length) throw new Error('invalidOperation');
  return { branches: preserveBranch(branches, operations, cursor, name, id), operations: structuredClone(operations.slice(0, from)), cursor: from };
}
