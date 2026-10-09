export type Saved = { version: number; active: string; datasets: any[]; operations: any[]; cursor: number; ui: any; revision?: number };
const DB = 'vis-hw03-v1';
const hashes = new Map<string, { raw: string; key: string }>();
let opening: Promise<IDBDatabase> | undefined;
function db() {
  return opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('workspaces'); request.result.createObjectStore('assets'); };
    request.onsuccess = () => { const database = request.result; database.onversionchange = () => { database.close(); opening = undefined; }; resolve(database); };
    request.onerror = () => { opening = undefined; reject(request.error); };
    request.onblocked = () => reject(new Error('storageBlocked'));
  });
}
export async function load(): Promise<Saved | null> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(['workspaces', 'assets'], 'readonly');
    let state: Saved | null = null; const files: Promise<void>[] = [];
    const request = tx.objectStore('workspaces').get('current');
    request.onsuccess = () => {
      state = request.result ?? null;
      if (state) for (const dataset of state.datasets) {
        const asset = tx.objectStore('assets').get(dataset.assetKey ?? dataset.id);
        asset.onsuccess = () => { if (!asset.result) { tx.abort(); return; } files.push(asset.result.text().then((raw: string) => { dataset.raw = raw; })); };
      }
    };
    tx.oncomplete = () => { Promise.all(files).then(() => resolve(state), reject); };
    tx.onabort = tx.onerror = () => reject(new Error('storageCorrupt'));
  });
}
export async function save(state: Saved, expected: number): Promise<number> {
  const database = await db();
  const prepared = await Promise.all(state.datasets.map(async ({ rows, raw, columns, assetKey, ...metadata }) => {
    const cached = hashes.get(metadata.id);
    if (cached && cached.raw === raw) return { metadata: { ...metadata, assetKey: cached.key }, raw };
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const key = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    hashes.set(metadata.id, { raw, key });
    return { metadata: { ...metadata, assetKey: key }, raw };
  }));
  const keepHashes = new Set(state.datasets.map(d => d.id));
  for (const id of hashes.keys()) if (!keepHashes.has(id)) hashes.delete(id);
  return new Promise((resolve, reject) => {
    const tx = database.transaction(['workspaces', 'assets'], 'readwrite'); let conflict = false;
    const workspaces = tx.objectStore('workspaces'), assets = tx.objectStore('assets');
    const request = workspaces.get('current');
    request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== expected) { conflict = true; tx.abort(); return; }
      const datasets = prepared.map(d => d.metadata);
      for (const dataset of prepared) {
        const existing = assets.get(dataset.metadata.assetKey);
        existing.onsuccess = () => { if (!existing.result) assets.put(new Blob([dataset.raw], { type: 'text/plain' }), dataset.metadata.assetKey); };
      }
      workspaces.put({ ...state, datasets, revision: expected + 1, savedAt: Date.now() }, 'current');
      const keep = new Set(datasets.map(d => d.assetKey));
      const scan = assets.openCursor(); scan.onsuccess = () => { const cursor = scan.result; if (cursor) { if (!keep.has(String(cursor.key))) cursor.delete(); cursor.continue(); } };
    };
    tx.oncomplete = () => resolve(expected + 1);
    tx.onabort = tx.onerror = () => reject(new Error(conflict ? 'storageConflict' : tx.error?.name === 'QuotaExceededError' ? 'storageQuota' : 'storageFailed'));
  });
}
export async function clear(expected: number) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction(['workspaces', 'assets'], 'readwrite'); let conflict = false;
    const request = tx.objectStore('workspaces').get('current'); request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== expected) { conflict = true; tx.abort(); return; }
      tx.objectStore('workspaces').delete('current'); tx.objectStore('assets').clear(); hashes.clear();
    };
    tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error(conflict ? 'storageConflict' : 'storageFailed'));
  });
}
