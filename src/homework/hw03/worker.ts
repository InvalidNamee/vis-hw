import { pairSample } from './statistics.mjs';
import { replay, parseData } from './model.mjs';
self.onmessage = (event) => {
  const { id, type, payload } = event.data;
  try {
    const result = type === 'parse' ? parseData(payload.raw, payload.format) : type === 'pair' ? pairSample(replay(payload.dataset,payload.operations,payload.cursor,payload.datasets).rows,payload.x,payload.y) : replay(payload.dataset, payload.operations, payload.cursor, payload.datasets);
    self.postMessage({ id, result });
  } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : 'invalidOperation' }); }
};
