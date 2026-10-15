import {columnRenameOperation} from './column-rename.mjs';
import {weightedWindowOperation} from './weighted-window.mjs';
import {dtypeTypes,dtypeOperation,typedProfile} from './dtypes.mjs';
import {asofOperation} from './asof.mjs';
import {extractAllOperation} from './extract-all.mjs';
import {axisReshapeTypes,axisReshapeOperation} from './axis-reshape.mjs';
import {validateListValues,explodeOperation} from './list-values.mjs';
import {alignmentTypes,alignmentOperation} from './index-alignment.mjs';
import {indexTypes,indexOperation,rangeIndex,applyIndexedOperation} from './indexing.mjs';
import { groupToolsOperation } from './group-tools.mjs';
import { ewmOperation } from './ewm.mjs';
import { datetimeOperation } from './datetime.mjs';
import { binningOperation } from './binning.mjs';
import { samplingOperation } from './sampling.mjs';
import { calculationOperation } from './calculation.mjs';
import { stringOperation } from './strings.mjs';
import { windowOperation } from './windows.mjs';
import { reshapeTypes, reshapeOperation } from './reshape.mjs';
import { mergeOperation, concatOperation } from './relational.mjs';
import { groupingOperation } from './grouping.mjs';
import { selectionTypes, selectionOperation, matchesCondition, compileCondition } from './selection.mjs';
import { cleaningTypes, cleaningOperation } from './cleaning.mjs';
import { statisticalTypes, statisticalOperation, moments, quantile } from './statistics.mjs';
import { extendedTypes, extendedOperation } from './extended.mjs';
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
    validateListValues(rows);
  } else rows = parseDelimited(raw, format === 'tsv' ? '\t' : format === 'semicolon' ? ';' : ',');
  if (!rows.length) throw new Error('emptyFile');
  const columns = [...new Set(rows.flatMap(r => Object.keys(r)))];
  if (rows.length > 100000 || columns.length > 200 || rows.length * columns.length > 2000000) throw new Error('tooManyRows');
  // Preserve identifiers with leading zeroes; infer only consistently numeric columns.
  const numeric = new Set(columns.filter(c => {
    const values = rows.map(r => Object.hasOwn(r,c)?r[c]:undefined).filter(v => !isMissing(v));
    return values.length && values.every(v => typeof v === 'number' ? isNumber(v) : typeof v === 'string' && Number.isFinite(Number(v)) && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(String(v).trim()) && !/^[-+]?0\d/.test(String(v).trim()) && (!/^[-+]?\d+$/.test(String(v).trim()) || Number.isSafeInteger(Number(v))));
  }));
  rows = rows.map(r => Object.fromEntries(columns.map(c => [c, !Object.hasOwn(r,c)||isMissing(r[c]) ? null : numeric.has(c) ? Number(r[c]) : r[c]])));
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
  if (values.some(Array.isArray)) return 'list';
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
    return { column, type: columnType(rows, column), missing: rows.length - values.length, unique: new Set(values.map(v => JSON.stringify(v))).size, min: numbers[0] ?? null, max: numbers.at(-1) ?? null, ...moments(numbers), count: values.length, q1: quantile(numbers,.25), q3: quantile(numbers,.75), mean, median: quantile(numbers,.5) };
  });
}
export const matches = matchesCondition;
function executeOperation(rows, columns, op, datasets = []) {
  if (!op || !op.params || typeof op.params !== 'object') throw new Error('invalidOperation');
  if(op.type==='columnRename')return columnRenameOperation(rows,columns,op);
  if(op.type==='weightedWindow')return weightedWindowOperation(rows,columns,op);
  if(dtypeTypes.includes(op.type))return dtypeOperation({rows,columns,index:rangeIndex(rows.length)},op);
  if(op.type==='asof')return asofOperation(rows,columns,op,datasets);
  if(op.type==='extractAll')return extractAllOperation({rows,columns,index:rangeIndex(rows.length)},op);
  if(axisReshapeTypes.includes(op.type))return axisReshapeOperation({rows,columns,index:rangeIndex(rows.length)},op);
  if(op.type==='explode')return explodeOperation({rows,columns,index:rangeIndex(rows.length)},op);
  if(alignmentTypes.includes(op.type))return alignmentOperation({rows,columns,index:rangeIndex(rows.length)},op,datasets);
  if(indexTypes.includes(op.type))return indexOperation({rows,columns},op);
  if (['groupFilter','groupRank'].includes(op.type)) return groupToolsOperation(rows,columns,op);
  if (op.type==='ewm') return ewmOperation(rows,columns,op);
  if (['dateparts','datediff','dateparse','resample'].includes(op.type)) return datetimeOperation(rows,columns,op);
  if (op.type==='binning') return binningOperation(rows,columns,op);
  if (op.type==='sampling') return samplingOperation(rows,columns,op);
  if (['formula','numeric'].includes(op.type)) return calculationOperation(rows, columns, op);
  if (op.type === 'strings') return stringOperation(rows, columns, op);
  if (op.type === 'windows') return windowOperation(rows, columns, op);
  if (reshapeTypes.includes(op.type)) return reshapeOperation(rows, columns, op);
  if (op.type === 'merge') return mergeOperation(rows, columns, op, datasets);
  if (op.type === 'concat') return concatOperation(rows, columns, op, datasets);
  if (op.type === 'groupMulti') return groupingOperation(rows, columns, op);
  if (selectionTypes.includes(op.type)) return selectionOperation(rows,columns,op);
  if (cleaningTypes.includes(op.type)) return cleaningOperation(rows,columns,op);
  if (statisticalTypes.includes(op.type)) return statisticalOperation(rows, columns, op);
  if (extendedTypes.includes(op.type)) return extendedOperation(rows, columns, op);
  if(op.type==='filter'){
    const p=op.params;
    if(!Array.isArray(p.filters))throw new Error('invalidCondition');
    const tests=p.filters.map(f=>compileCondition(f,columns));
    return {columns,rows:rows.filter(row=>{
      const matched=p.mode==='or'?tests.some(test=>test(row)):tests.every(test=>test(row));
      return p.exclude?!matched:matched;
    })};
  }
  throw new Error('invalidOperation');
}
export function applyOperation(rows, columns, op, datasets = []) {
  const result=executeOperation(rows,columns,op,datasets);
  if(result.rows.length>100000||result.columns.length>200||result.rows.length*result.columns.length>2000000)throw new Error('tooManyRows');
  return result;
}
export function replay(dataset, operations, cursor, datasets) {
  let result = { rows: dataset.rows, columns: dataset.columns, index:rangeIndex(dataset.rows.length) }; const steps = [];
  for (const [index,op] of operations.slice(0, cursor).entries()) { const before = result.rows.length; result = applyIndexedOperation(result,op,(rows,columns)=>applyOperation(rows,columns,op,datasets),datasets); if(result.analysis)result.analysis.sourceCursor=index; steps.push({ before, after: result.rows.length }); }
  return { ...result, steps, profile: typedProfile(profile(result.rows, result.columns),result.types) };
}
export function toCSV(rows, columns) {
  const escape = v => '"' + (Array.isArray(v)?JSON.stringify(v):String(v ?? '')).replaceAll('"', '""') + '"';
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
