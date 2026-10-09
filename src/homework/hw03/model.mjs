export const isMissing = v => v === null || v === undefined || v === '';
export const isNumber = v => typeof v === 'number' && Number.isFinite(v);
export function parseDelimited(text, delimiter = ',') {
  text = text.replace(/^\uFEFF/, '');
  const lines = []; let row = [], cell = '', quoted = false, afterQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; afterQuote = true; } }
      else cell += c;
    } else if (c === '"' && !cell && !afterQuote) quoted = true;
    else if (c === delimiter) { row.push(cell); cell = ''; afterQuote = false; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(v => v !== '')) lines.push(row); row = []; cell = ''; afterQuote = false;
    } else if (afterQuote) { if (c !== ' ' && c !== '\t') throw new Error('csvInvalid'); }
    else { if (c === '"') throw new Error('csvInvalid'); cell += c; }
  }
  if (quoted) throw new Error('csvInvalid');
  row.push(cell); if (row.some(v => v !== '')) lines.push(row);
  if (!lines.length) throw new Error('emptyFile');
  const columns = lines.shift().map(v => v.trim());
  if (columns.some(v => !v) || new Set(columns).size !== columns.length) throw new Error('duplicateColumns');
  if (lines.some(v => v.length !== columns.length)) throw new Error('rowWidth');
  return lines.map(values => Object.fromEntries(columns.map((key, i) => [key, values[i]])));
}
export function parseData(raw, format) {
  let rows;
  if (format === 'json') {
    try { rows = JSON.parse(raw); } catch { throw new Error('jsonInvalid'); }
    if (!Array.isArray(rows) || !rows.length || rows.some(r => !r || Array.isArray(r) || typeof r !== 'object')) throw new Error('jsonInvalid');
    if (rows.some(r => Object.values(r).some(v => v !== null && typeof v === 'object'))) throw new Error('nestedJson');
  } else rows = parseDelimited(raw, format === 'tsv' ? '\t' : format === 'semicolon' ? ';' : ',');
  if (!rows.length) throw new Error('emptyFile');
  const columns = [...new Set(rows.flatMap(r => Object.keys(r)))];
  if (rows.length > 100000 || columns.length > 200 || rows.length * columns.length > 2000000) throw new Error('tooManyRows');
  // Preserve identifiers with leading zeroes; infer only consistently numeric columns.
  const numeric = new Set(columns.filter(c => {
    const values = rows.map(r => r[c]).filter(v => !isMissing(v));
    return values.length && values.every(v => typeof v === 'number' ? isNumber(v) : /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(String(v).trim()) && !/^[-+]?0\d/.test(String(v).trim()));
  }));
  rows = rows.map(r => Object.fromEntries(columns.map(c => [c, isMissing(r[c]) ? null : numeric.has(c) ? Number(r[c]) : r[c]])));
  return { rows, columns };
}
export function defaultDatasets() {
  const products = [
    { product_id: 'P01', category: 'Technology', product: 'Monitor' }, { product_id: 'P02', category: 'Technology', product: 'Keyboard' },
    { product_id: 'P03', category: 'Furniture', product: 'Chair' }, { product_id: 'P04', category: 'Furniture', product: 'Desk' },
    { product_id: 'P05', category: 'Office', product: 'Notebook' }, { product_id: 'P06', category: 'Office', product: 'Pen set' },
  ];
  let seed = 42; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const regions = ['East', 'West', 'North', 'South'];
  const rows = Array.from({ length: 640 }, (_, i) => {
    const p = products[Math.floor(random() * products.length)], qty = 1 + Math.floor(random() * 9), discount = Math.round(random() * 30) / 100;
    const sales = Math.round((40 + random() * 260) * qty * (1 - discount) * 100) / 100;
    return { order_id: `O${String(i + 1).padStart(4, '0')}`, date: new Date(Date.UTC(2025, 0, 1 + Math.floor(random() * 365))).toISOString().slice(0, 10), region: regions[Math.floor(random() * 4)], product_id: p.product_id, category: p.category, quantity: qty, sales: i % 157 === 0 ? sales * 6 : sales, cost: i % 29 === 0 ? null : Math.round(sales * (.48 + random() * .5) * 100) / 100, discount };
  });
  rows.push({ ...rows[5] }, { ...rows[81] }, { ...rows[200] });
  return [{ id: 'demo-orders-v1', name: 'orders.json', format: 'json', raw: JSON.stringify(rows) }, { id: 'demo-products-v1', name: 'products.json', format: 'json', raw: JSON.stringify(products) }].map(d => ({ ...d, ...parseData(d.raw, d.format) }));
}
export function columnType(rows, column) {
  const values = rows.map(r => r[column]).filter(v => !isMissing(v));
  if (!values.length) return 'empty';
  if (values.every(isNumber)) return 'number';
  if (values.every(v => typeof v === 'boolean')) return 'boolean';
  if (values.every(v => /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(String(v)) && Number.isFinite(Date.parse(String(v))))) return 'date';
  return 'text';
}
export function profile(rows, columns) {
  return columns.map(column => {
    const values = rows.map(r => r[column]).filter(v => !isMissing(v));
    const numbers = values.filter(isNumber).sort((a, b) => a - b);
    const mean = numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
    return { column, type: columnType(rows, column), missing: rows.length - values.length, unique: new Set(values.map(v => JSON.stringify(v))).size, min: numbers[0] ?? null, max: numbers.at(-1) ?? null, mean, median: numbers.length ? (numbers[Math.floor((numbers.length - 1) / 2)] + numbers[Math.floor(numbers.length / 2)]) / 2 : null };
  });
}
export function matches(row, f) {
  const v = row[f.column];
  if (f.operator === 'missing') return isMissing(v);
  if (f.operator === 'present') return !isMissing(v);
  if (isMissing(v)) return false;
  if (f.operator === 'eq') return String(v) === String(f.value);
  if (f.operator === 'contains') return String(v).toLowerCase().includes(String(f.value).toLowerCase());
  if (f.operator === 'range') return isNumber(v) && v >= Number(f.value) && v <= Number(f.upper);
  if (f.operator === 'gte') return isNumber(v) && v >= Number(f.value);
  if (f.operator === 'lte') return isNumber(v) && v <= Number(f.value);
  return false;
}
export function aggregate(values, method) {
  if (!['count','nunique','sum','mean','median','min','max','std'].includes(method)) throw new Error('invalidOperation');
  const valid = values.filter(v => !isMissing(v)), nums = valid.filter(isNumber).sort((a, b) => a - b);
  if (method === 'count') return valid.length;
  if (method === 'nunique') return new Set(valid.map(v => JSON.stringify(v))).size;
  if (method === 'sum') return nums.reduce((a, b) => a + b, 0);
  if (!nums.length) return null;
  if (method === 'mean') return nums.reduce((a, b) => a + b, 0) / nums.length;
  if (method === 'median') return (nums[Math.floor((nums.length - 1) / 2)] + nums[Math.floor(nums.length / 2)]) / 2;
  if (method === 'min') return nums[0];
  if (method === 'max') return nums.at(-1);
  if (method === 'std') { if (nums.length < 2) return null; const m = aggregate(nums, 'mean'); return Math.sqrt(nums.reduce((a, v) => a + (v - m) ** 2, 0) / (nums.length - 1)); }
  throw new Error('invalidOperation');
}
function requireColumns(columns, keys) { if (keys.some(c => !columns.includes(c))) throw new Error('missingColumn'); }
export function applyOperation(rows, columns, op, datasets = []) {
  if (!op || !op.params || typeof op.params !== 'object') throw new Error('invalidOperation');
  const p = op.params;
  let output = rows, names = [...columns];
  switch (op.type) {
    case 'filter': requireColumns(columns, p.filters.map(f => f.column)); output = rows.filter(r => { const matched = p.mode === 'or' ? p.filters.some(f => matches(r, f)) : p.filters.every(f => matches(r, f)); return p.exclude ? !matched : matched; }); break;
    case 'sort': requireColumns(columns, [p.column]); output = [...rows].sort((a, b) => isMissing(a[p.column]) ? (isMissing(b[p.column]) ? 0 : 1) : isMissing(b[p.column]) ? -1 : (isNumber(a[p.column]) && isNumber(b[p.column]) ? a[p.column] - b[p.column] : String(a[p.column]).localeCompare(String(b[p.column]))) * (p.desc ? -1 : 1)); break;
    case 'dedup': { const seen = new Set(); output = rows.filter(r => { const key = JSON.stringify(columns.map(c => r[c])); if (seen.has(key)) return false; seen.add(key); return true; }); break; }
    case 'dropMissing': requireColumns(columns, [p.column]); output = rows.filter(r => !isMissing(r[p.column])); break;
    case 'fill': {
      requireColumns(columns, [p.column]); let value = p.value;
      if (p.method !== 'constant') value = aggregate(rows.map(r => r[p.column]), p.method);
      else if (columnType(rows, p.column) === 'number') { if (String(value).trim() === '' || !Number.isFinite(Number(value))) throw new Error('invalidNumber'); value = Number(value); }
      if (isMissing(value)) throw new Error('noValues'); output = rows.map(r => isMissing(r[p.column]) ? { ...r, [p.column]: value } : r); break;
    }
    case 'calculate': {
      if (!['+','-','*','/'].includes(p.operator)) throw new Error('invalidOperation');
      requireColumns(columns, [p.left, p.right]); if (!p.name?.trim() || columns.includes(p.name)) throw new Error('duplicateColumns');
      if (![p.left, p.right].every(c => columnType(rows, c) === 'number')) throw new Error('invalidNumber');
      output = rows.map(r => { const a = r[p.left], b = r[p.right]; let value = null; if (isNumber(a) && isNumber(b)) { value = p.operator === '+' ? a + b : p.operator === '-' ? a - b : p.operator === '*' ? a * b : b === 0 ? null : a / b; if (!Number.isFinite(value)) value = null; } return { ...r, [p.name]: value }; }); names.push(p.name); break;
    }
    case 'group': {
      requireColumns(columns, [p.group, p.value]); if (p.month && columnType(rows, p.group) !== 'date') throw new Error('invalidDate'); const groups = new Map();
      rows.forEach(r => { const value = p.month ? String(r[p.group] ?? '').slice(0, 7) : r[p.group]; if (p.month && !/^\d{4}-\d{2}$/.test(value)) return; const key = JSON.stringify(value); if (!groups.has(key)) groups.set(key, { key: value, values: [] }); groups.get(key).values.push(r[p.value]); });
      const name = `${p.value}_${p.method}`; names = [p.group, name]; output = [...groups.values()].map(g => ({ [p.group]: g.key, [name]: aggregate(g.values, p.method) })); break;
    }
    case 'pivot': {
      requireColumns(columns, [p.group, p.pivot, p.value]); const categories = [...new Set(rows.map(r => r[p.pivot]).filter(v => !isMissing(v)))];
      if (categories.length > 60) throw new Error('tooManyCategories');
      names = [p.group, ...categories.map(c => `value:${String(c)}`)]; if (new Set(names).size !== names.length) throw new Error('duplicateColumns'); const groups = new Map();
      rows.forEach(r => { const key = JSON.stringify(r[p.group]); if (!groups.has(key)) groups.set(key, { key: r[p.group], rows: [] }); groups.get(key).rows.push(r); });
      output = [...groups.values()].map(g => Object.fromEntries([[p.group, g.key], ...categories.map(c => { const records = g.rows.filter(r => r[p.pivot] === c); return [`value:${String(c)}`, records.length ? aggregate(records.map(r => r[p.value]), p.method) : null]; })])); break;
    }
    case 'join': {
      if (!['left','inner'].includes(p.how)) throw new Error('invalidOperation');
      requireColumns(columns, [p.leftKey]); const right = datasets.find(d => d.id === p.dataset); if (!right) throw new Error('missingDataset'); requireColumns(right.columns, [p.rightKey]);
      const added = right.columns.filter(c => c !== p.rightKey).map(c => [c, columns.includes(c) ? `${c}_right` : c]);
      if (added.some(([, c]) => names.includes(c)) || new Set(added.map(([, c]) => c)).size !== added.length) throw new Error('duplicateColumns');
      names.push(...added.map(([, c]) => c)); const index = new Map();
      right.rows.forEach(r => { const key = JSON.stringify(r[p.rightKey]); if (!index.has(key)) index.set(key, []); index.get(key).push(r); });
      output = []; for (const r of rows) { const match = index.get(JSON.stringify(r[p.leftKey])) ?? []; if (!match.length && p.how === 'left') output.push({ ...r, ...Object.fromEntries(added.map(([, c]) => [c, null])) }); for (const other of match) output.push({ ...r, ...Object.fromEntries(added.map(([c, name]) => [name, other[c]])) }); if (output.length > 100000) throw new Error('tooManyRows'); } break;
    }
    default: throw new Error('invalidOperation');
  }
  return { rows: output, columns: names };
}
export function replay(dataset, operations, cursor, datasets) {
  let result = { rows: dataset.rows, columns: dataset.columns }; const steps = [];
  for (const op of operations.slice(0, cursor)) { const before = result.rows.length; result = applyOperation(result.rows, result.columns, op, datasets); steps.push({ before, after: result.rows.length }); }
  return { ...result, steps, profile: profile(result.rows, result.columns) };
}
export function toCSV(rows, columns) {
  const escape = v => '"' + String(v ?? '').replaceAll('"', '""') + '"';
  return '\uFEFF' + [columns.map(escape).join(','), ...rows.map(r => columns.map(c => escape(r[c])).join(','))].join('\r\n');
}
export function validateBackup(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.datasets) || !Array.isArray(value.operations) || !Number.isInteger(value.cursor) || value.cursor < 0 || value.cursor > value.operations.length || !value.datasets.length || value.datasets.length > 20) throw new Error('backupInvalid');
  if (value.datasets.reduce((n, d) => n + (typeof d.raw === 'string' ? new TextEncoder().encode(d.raw).length : 0), 0) > 20 * 1048576) throw new Error('workspaceLimit');
  const ids = new Set(); const datasets = value.datasets.map(d => { if (typeof d.id !== 'string' || ids.has(d.id) || typeof d.name !== 'string' || typeof d.raw !== 'string' || !['csv', 'tsv', 'json', 'semicolon'].includes(d.format)) throw new Error('backupInvalid'); ids.add(d.id); return { id: d.id, name: d.name, raw: d.raw, format: d.format, ...parseData(d.raw, d.format) }; });
  if (!ids.has(value.active)) throw new Error('backupInvalid');
  replay(datasets.find(d => d.id === value.active), value.operations, value.operations.length, datasets);
  for (const d of datasets) { const original = value.datasets.find(v => v.id === d.id); d.operations = original.operations ?? []; d.cursor = original.cursor ?? 0; if (!Array.isArray(d.operations) || !Number.isInteger(d.cursor) || d.cursor < 0 || d.cursor > d.operations.length) throw new Error('backupInvalid'); replay(d, d.operations, d.operations.length, datasets); d.branches = original.branches ?? []; if (!Array.isArray(d.branches)) throw new Error('backupInvalid'); for (const b of d.branches) { if (typeof b.id !== 'string' || !Array.isArray(b.operations) || !Number.isInteger(b.cursor) || b.cursor < 0 || b.cursor > b.operations.length) throw new Error('backupInvalid'); replay(d, b.operations, b.operations.length, datasets); } }
  return { ...value, datasets };
}
