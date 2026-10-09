import { replay, parseData } from './model.mjs';
self.onmessage = (event) => {
  const { id, type, payload } = event.data;
  try {
    const result = type === 'parse' ? parseData(payload.raw, payload.format) : replay(payload.dataset, payload.operations, payload.cursor, payload.datasets);
    self.postMessage({ id, result });
  } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : 'invalidOperation' }); }
};
