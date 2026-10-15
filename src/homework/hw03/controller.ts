import {reproductionWorkspace,replayScript,pandasBridgeScript} from './reproducibility.mjs';
import {displayValue} from './list-values.mjs';
import {indexQueryForm} from './index-query-view';
import {ensureIndexQuery,indexQueryParams,indexCells,decodeIndexCell} from './index-query.mjs';
import {exportIndexed,rangeIndex} from './indexing.mjs';
import ParquetWorker from './parquet-worker?worker';
import ExcelWorker from './excel-worker?worker';
import {toJSON,fetchDataFile} from './io.mjs';
import {namedAggregationForm} from './group-tools-view';
import {expressionForm,expressionNode,newExpression,expressionSummary} from './calculation-view';
import { mergeForm } from './relational-view';
import { queryForm, queryNode, newCondition, conditionSummary, sortForm } from './selection-view';
import { filterOperators } from './selection.mjs';
import { statisticsHTML, drawStatistics } from './statistics-view';
import { extendedTools, optionValue, visibleControls, advancedParams } from './extended-tools';
import * as d3 from 'd3';
import {numericDistribution} from './numeric-distribution.mjs';
import { t, copy, type Key } from './copy';
import { defaultDatasets, matches, isMissing, isNumber, toCSV, validateBackup } from './model.mjs';
import * as storage from './storage';
import { preserveBranch, forkHistory } from './history.mjs';
import AnalysisWorker from './worker?worker';

type Row = Record<string, any>;
type Dataset = { id: string; name: string; format: string; raw: string; rows: Row[]; columns: string[]; operations?: Operation[]; cursor?: number; branches?: any[] };
type Operation = { type: string; params: any };
type Filter = { column: string; operator: string; value?: any; upper?: any };
type Result = { index?:any; columnIndex?:any; types?:any; rows: Row[]; columns: string[]; profile: any[]; analysis?: any; steps: { before: number; after: number }[] };
const worker = new AnalysisWorker();
let jobId = 0;
const jobs = new Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }>();
worker.onmessage = e => { const job = jobs.get(e.data.id); if (job) { jobs.delete(e.data.id); e.data.error ? job.reject(new Error(e.data.error)) : job.resolve(e.data.result); } };
worker.onerror = () => { for (const job of jobs.values()) job.reject(new Error('invalidOperation')); jobs.clear(); };
const compute = (type: string, payload: any) => new Promise<any>((resolve, reject) => { const id = ++jobId; jobs.set(id, { resolve, reject }); worker.postMessage({ id, type, payload }); });
let datasets: Dataset[] = defaultDatasets(), active = datasets[0].id, operations: Operation[] = [], cursor = 0;
let result: Result = { rows: datasets[0].rows, columns: datasets[0].columns, profile: [], steps: [] };
let root: HTMLElement | null = null, ready = false, busy = false, revision = 0, autosave = true, dirty = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined, saveQueue: Promise<any> = Promise.resolve();
let saveStatus: Key = 'loading', notice = '', previewResult: Result | null = null;
let refreshToken = 0;
let pairDetail:any=null,pairPending=false,pairToken=0;
let previewOp: Operation | null = null, previewToken = 0, previewTimer: ReturnType<typeof setTimeout>, lastSummary: any = null;
let resultModeManual = false;
let ui: any = { section: 'select', view: 'overview', tool: '', resultMode: 'after', inspect: null, panels: {datasets:true, fields:true, timeline:true, storage:false}, selectedFields: [], sidebarHidden: window.matchMedia('(max-width:650px)').matches, x: 'sales', y: 'cost', category: 'region', filters: [], mode: 'and', page: 0 };
const source = () => datasets.find(d => d.id === active)!;
const $ = <T extends Element = HTMLElement>(selector: string) => root?.querySelector<T>(selector) ?? null;
const esc = (value: any) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const label = (value: any) => displayValue(value);
const number = (value: any) => isMissing(value) ? '—' : new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-US' : 'zh-CN', { maximumFractionDigits: 2 }).format(value);
const fieldOptions = (columns: string[], current?: string) => columns.map(c => `<option value="${esc(c)}" ${c === current ? 'selected' : ''}>${esc(c)}</option>`).join('');
const field = (title: Key, name: string, options: string) => `<label>${t(title)}<select data-control="${name}">${options}</select></label>`;
const input = (title: Key, name: string, value = '', type = 'text') => `<label>${t(title)}<input data-control="${name}" type="${type}" value="${esc(value)}"/></label>`;
const button = (action: string, key: Key, primary = false) => `<button data-action="${action}" ${primary ? 'class="primary"' : ''}>${t(key)}</button>`;
const selectedRows = (data: Result = result) => data.rows.filter(r => ui.filters.length === 0 || (ui.mode === 'or' ? ui.filters.some((f: Filter) => matches(r, f)) : ui.filters.every((f: Filter) => matches(r, f))));
function showNotice(key: string) { notice = key; for (const selector of ['[data-notice]', '[data-import-notice]']) { const element = $(selector); if (element) { element.hidden = !notice; element.textContent = notice ? t((notice in errorKeys ? notice : 'invalidOperation') as Key) : ''; } } }
const errorKeys: Record<string, boolean> = Object.fromEntries(['storageConflict','storageQuota','storageFailed','storageCorrupt','storageBlocked','emptyFile','csvInvalid','rowWidth','duplicateColumns','jsonInvalid','nestedJson','listDepth','explodeLengths','invalidColumnIndex','unstackMultiIndex','asofMissing','asofKeyType','asofOrder','invalidNumber','noValues','missingColumn','missingDataset','invalidOperation','tooManyCategories','tooManyRows','fileTooLarge','unsupported','backupInvalid','invalidDate','workspaceLimit','noMatchingColumns','invalidCondition','invalidPositions','missingRowLabel','mergeValidation','invalidTransposeLabels','marginConflict','windowTimeOrder','invalidRegex','regexGroups','stringOutputLimit','invalidFormula','invalidBins','duplicateBins','invalidSample','invalidWeights','invalidTimezone','ambiguousTime','nonexistentTime','invalidDateFormat','invalidDecay','ewmSumAdjust','ewmTimeMean','weightedWorkLimit','renameFlattenFirst','renameCount','replayExportFailed','invalidCategories','invalidDtypeValue','notCategorical','categoryNewValue','categoryOrderRequired','categoryNumeric','invalidWorkbook','workbookExpandedLimit','invalidDataURL','dataFetchFailed','noImportSelection','importBusy','invalidEncoding','indexLevelMismatch','invalidIndexLevels','indexKeepLevel','invalidIndexLabels','invalidIndexValue','missingIndexLabel','indexSliceOrder','indexSliceAmbiguous','duplicateIndexReindex','indexFillOrder','invalidIndexTolerance','duplicateIndex','invalidIndexNames','invalidParquet','parquetNested','parquetExpandedLimit'].map(k => [k,true]));
function snapshot() {
  return { version: 1, active, datasets: datasets.map(d => d.id === active ? { ...d, operations, cursor } : { ...d }), operations: structuredClone(operations), cursor, ui: structuredClone(ui) };
}
function updateStatus() {
  if ($('[data-save-status]')) $('[data-save-status]')!.textContent = t(autosave ? saveStatus : 'temporary');
  const checkbox = $<HTMLInputElement>('[data-autosave]'); if (checkbox) checkbox.checked = autosave;
}
function scheduleSave() {
  dirty++; saveStatus = 'unsaved'; updateStatus(); clearTimeout(saveTimer);
  if (autosave && ready) saveTimer = setTimeout(() => void persist(), 800);
}
async function persist() {
  if (!autosave || !ready) return;
  const targetDirty = dirty, state = snapshot(); saveStatus = 'saving'; updateStatus();
  saveQueue = saveQueue.then(async () => {
    try { revision = await storage.save(state, revision); saveStatus = dirty === targetDirty ? 'saved' : 'unsaved'; if (notice.startsWith('storage')) { notice = ''; showNotice(''); } }
    catch (error) { saveStatus = 'unsaved'; showNotice((error as Error).message); }
    updateStatus(); await updateCapacity();
  });
  await saveQueue;
}
async function updateCapacity() {
  try { const estimate = await navigator.storage?.estimate(); if (estimate && $('[data-capacity]')) $('[data-capacity]')!.textContent = `${t('capacity')}: ${number((estimate.usage ?? 0) / 1048576)} MB`; } catch {}
}
const inspecting = () => Number.isInteger(ui.inspect) && ui.inspect !== cursor;
const viewCursor = () => Number.isInteger(ui.inspect) ? ui.inspect : cursor;
const shownResult = () => previewResult && ui.resultMode !== 'before' ? previewResult : result;
// A preview's Before view must use the complete input, without draft filters.
const visibleRows = () => previewResult ? shownResult().rows : selectedRows();
function syncDefaultResultMode(){
  if(!previewResult||resultModeManual)return false;
  const mode=previewResult.analysis?'after':($('[data-view]')?.clientWidth??0)>=800?'compare':'after';
  if(ui.resultMode===mode)return false;
  ui.resultMode=mode;ui.page=0;
  return true;
}
function filterDescription(filter:Filter){
  const operator=filter.operator==='missing'?'missingOp':filter.operator as Key;
  const noValue=['missing','present'].includes(filter.operator);
  return `${filter.column} ${t(operator)}${noValue?'':' '+(filter.value??'')}${filter.upper!==undefined?' – '+filter.upper:''}`;
}
function selectionHTML(){
  if(!ui.filters.length||ui.tool||inspecting())return '';
  return `<span>${t('temporarySelection')} <strong>${number(selectedRows().length)}</strong> / ${number(result.rows.length)}</span><span>${t(ui.mode==='or'?'or':'and')}</span>${ui.filters.map((filter:Filter,i:number)=>`<button class="loom-chip" data-remove-filter="${i}" aria-label="${esc(t('removeCondition')+': '+filterDescription(filter))}">${esc(filterDescription(filter))} ×</button>`).join('')}${button('keep-selected','keepSelected',true)}${button('exclude-selected','excludeSelected')}${button('clear-filters','clearFilters')}`;
}
async function refresh() {
  pairDetail=null;pairPending=false;pairToken++;
  const token=++refreshToken;
  const computed = await compute('replay', { dataset: source(), operations, cursor: viewCursor(), datasets }); if(token!==refreshToken)return; result = computed; previewResult = null; normalizeFields(); render();
}
function normalizeFields() {
  if (!['overview','data'].includes(ui.view)) ui.view = 'overview';
  if (!Object.hasOwn(sectionTools,ui.section)) ui.section = 'select';
  if (!['',...Object.keys(extendedTools),'filterTree','sort','quality'].includes(ui.tool)) ui.tool = '';
  if (!Number.isInteger(ui.inspect) || ui.inspect < 0 || ui.inspect > operations.length) ui.inspect = null;
  ui.selectedFields = Array.isArray(ui.selectedFields) ? ui.selectedFields.filter((c:string)=>result.columns.includes(c)) : [];
  ui.panels = {datasets:true,fields:true,timeline:true,storage:false,...ui.panels};
  ui.mode = ui.mode === 'or' ? 'or' : 'and';
  ui.page = Number.isInteger(ui.page) && ui.page >= 0 ? ui.page : 0;
  ui.filters = Array.isArray(ui.filters) ? ui.filters.filter((f: any) => f && typeof f.column === 'string' && filterOperators.includes(f.operator)) : [];
  const numeric = result.profile.filter(p => p.type === 'number').map(p => p.column);
  if (!numeric.includes(ui.x)) ui.x = numeric[0] ?? '';
  if (!numeric.includes(ui.y)) ui.y = numeric.find((c: string) => c !== ui.x) ?? numeric[0] ?? '';
  const categories = result.profile.filter(p => p.type !== 'number' && p.type !== 'list' && p.unique <= 60 && p.unique > 0).map(p => p.column);
  if (!categories.includes(ui.category)) ui.category = categories[0] ?? '';
  ui.filters = ui.filters.filter((f: Filter) => result.columns.includes(f.column));
}
function indexForRows(data:Result,rows:Row[]){if(!data.index?.explicit)return data.index;const map=new Map(data.rows.map((row,i)=>[row,data.index.values[i]]));return {...data.index,values:rows.map(row=>map.get(row))};}
function exportData(){const shown=shownResult(),rows=visibleRows();return $<HTMLInputElement>('[data-export-index]')?.checked?exportIndexed(rows,shown.columns,indexForRows(shown,rows)):{rows,columns:shown.columns};}
function table(rows: Row[], columns: string[], sort = false, limit = 50, headers:Record<string,string>={},index?:any,columnIndex?:any) {
  if (!rows.length) return `<div class="loom-empty">${t('noRows')}</div>`;
  const depth=columnIndex?.names.length??1,tuples=columnIndex?.values??columns.map(c=>[headers[c]??c]);
  const head=Array.from({length:depth},(_,level)=>{
    let cells=level===0&&index?.explicit?index.names.map((name:string,i:number)=>`<th rowspan="${depth}" class="loom-index-cell">${esc(name??`${t('indexLabel')} ${i+1}`)}</th>`).join(''):'';
    for(let i=0;i<columns.length;){let span=1;if(level<depth-1)while(i+span<columns.length&&JSON.stringify(tuples[i].slice(0,level+1))===JSON.stringify(tuples[i+span].slice(0,level+1)))span++;const text=tuples[i]?.[level]??'∅';cells+=`<th colspan="${span}" title="${esc(columnIndex?.names[level]??columns[i])}">${sort&&level===depth-1?`<button data-sort="${esc(columns[i])}">${esc(text)}</button>`:esc(text)}</th>`;i+=span;}
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<div class="loom-table-wrap"><table><thead>${head}</thead><tbody>${rows.slice(0, limit).map((r,i) => `<tr>${index?.explicit?index.values[i].map((v:any)=>`<th scope="row" class="loom-index-cell">${esc(v??'∅')}</th>`).join(''):''}${columns.map(c => `<td class="${isMissing(r[c]) ? 'null' : isNumber(r[c]) ? 'numeric' : ''}" title="${esc(label(r[c]))}">${isMissing(r[c]) ? '∅' : isNumber(r[c]) ? number(r[c]) : esc(label(r[c]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const sectionTools: Record<string, {label: Key; tools: string[]}[]> = {
  select: [
    {label:'filterTools',tools:['filterTree','rowSelect']},
    {label:'orderRankTools',tools:['sort','topN','groupRank']},
    {label:'samplingTools',tools:['sampling']},
    {label:'columnManagementTools',tools:['columns','columnRename','selectTypes']},
  ],
  clean: [
    {label:'qualityTools',tools:['quality','iqr']},
    {label:'missingTools',tools:['fill','dropMissing']},
    {label:'duplicateTools',tools:['dedup']},
    {label:'valueCleaningTools',tools:['replace','text']},
    {label:'typeConversionTools',tools:['convert','dtype']},
  ],
  transform: [
    {label:'numericFormulaTools',tools:['formula','numeric']},
    {label:'textProcessingTools',tools:['strings','extractAll']},
    {label:'binCategoryTools',tools:['binning','category']},
  ],
  group: [
    {label:'descriptiveTools',tools:['describe','quantiles','frequencies']},
    {label:'relationshipTools',tools:['correlation']},
    {label:'groupAnalysisTools',tools:['groupMulti','groupFilter']},
    {label:'pivotSummaryTools',tools:['pivotMulti','crosstab']},
  ],
  reshape: [
    {label:'wideLongTools',tools:['melt','stack','unstack']},
    {label:'rowColumnShapeTools',tools:['explode','transpose']},
  ],
  join: [
    {label:'keyMatchingTools',tools:['merge','asof']},
    {label:'appendTablesTools',tools:['concat','indexConcat']},
    {label:'indexAlignmentTools',tools:['indexJoin','indexArithmetic']},
  ],
  index: [
    {label:'rowIndexTools',tools:['setIndex','resetIndex','sortIndex','renameIndex','indexLevels']},
    {label:'indexSelectionTools',tools:['indexLoc','indexAssign','reindex']},
    {label:'columnIndexTools',tools:['columnIndex']},
  ],
  time: [
    {label:'dateProcessingTools',tools:['dateparse','dateparts','datediff']},
    {label:'timeAggregationTools',tools:['resample']},
    {label:'sequenceWindowTools',tools:['windows','weightedWindow','ewm']},
  ],
};
const toolKey = (tool:string):Key => extendedTools[tool]?.label ?? ({filterTree:'filterTreeTool',filter:'filter',sort:'sort',quality:'quality'} as Record<string,Key>)[tool]??'overview';
const toolAliases:Record<string,string>={filterTree:'filter query where isin boolean and or not',rowSelect:'iloc head tail take',indexLoc:'loc xs slice labels',indexAssign:'loc setitem assign',dtype:'astype to_numeric convert_dtypes categorical Int64 Float64 string boolean',category:'cat codes set_categories add_categories remove_categories remove_unused_categories rename_categories reorder_categories as_ordered',groupMulti:'groupby agg named transform 逐项命名聚合',groupFilter:'groupby filter',groupRank:'groupby rank',describe:'describe info',quantiles:'quantile median',frequencies:'value_counts',correlation:'corr cov pearson spearman',columnRename:'rename add_prefix add_suffix 重命名 批量命名',columns:'drop reindex columns',dropMissing:'dropna isna notna',fill:'fillna ffill bfill interpolate time',dedup:'duplicated drop_duplicates',setIndex:'set_index MultiIndex',resetIndex:'reset_index',sortIndex:'sort_index',renameIndex:'rename_axis',indexLevels:'swaplevel reorder_levels droplevel',columnIndex:'MultiIndex columns flatten',indexJoin:'join index',indexConcat:'concat axis align',indexArithmetic:'align add sub mul div floordiv mod pow',asof:'merge_asof nearest',pivotMulti:'pivot_table',crosstab:'crosstab',strings:'str split rsplit extract replace cat pad zfill contains match fullmatch count findall',extractAll:'str extractall',numeric:'add sub mul div pow round clip abs log sqrt',formula:'calculate assign where mask eval',binning:'cut qcut',sampling:'sample weights replace stratified 随机抽样 分层 加权',dateparse:'to_datetime tz_localize tz_convert',dateparts:'dt year month day isocalendar',datediff:'timedelta',resample:'resample asfreq 按月汇总 月汇总',windows:'rolling expanding shift diff pct_change cumsum cumprod cummin cummax cov corr',weightedWindow:'rolling win_type gaussian triang hann hamming bartlett blackman',ewm:'ewm halflife times'};
const sectionLabels:Record<string,Key>={select:'selectSection',clean:'cleanSection',transform:'transformSection',group:'groupSection',reshape:'reshapeSection',join:'joinSection',index:'indexSection',time:'timeSection'};
function renderToolSearch(){const query=$<HTMLInputElement>('[data-tool-search]')?.value.trim().toLocaleLowerCase()??'',items=Object.entries(sectionTools).flatMap(([section,groups])=>groups.flatMap(g=>g.tools.map(tool=>({section,tool})))).filter(({tool})=>[tool,toolAliases[tool]??'',...copy[toolKey(tool)]].join(' ').toLocaleLowerCase().includes(query));const results=$('[data-tool-search-results]');if(!results)return;results.innerHTML=items.length?items.map(({section,tool})=>`<button data-search-tool="${tool}" data-search-section="${section}" ${inspecting()?'disabled':''}><span><strong>${t(toolKey(tool))}</strong><small>${esc(toolAliases[tool]??tool)}</small></span><em>${t(sectionLabels[section])}</em></button>`).join(''):`<p>${t('noToolMatches')}</p>`;}
function toggleToolMenu(trigger:HTMLElement){
  const menu=$<HTMLElement>(`[data-tool-menu-panel="${trigger.dataset.toolMenu}"]`);if(!menu)return;
  if(menu.matches(':popover-open')){menu.hidePopover();trigger.setAttribute('aria-expanded','false');return;}
  const rect=trigger.getBoundingClientRect(),width=Math.min(264,window.innerWidth-24),below=window.innerHeight-rect.bottom-12,above=rect.top-12;
  const placeAbove=below<180&&above>below,height=Math.min(360,placeAbove?above:below);
  menu.style.width=width+'px';menu.style.maxHeight=Math.max(80,height)+'px';
  menu.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px';
  menu.style.top=(placeAbove?Math.max(12,rect.top-height-6):rect.bottom+6)+'px';
  menu.showPopover();trigger.setAttribute('aria-expanded','true');
}
function openToolSearch(){const dialog=$<HTMLDialogElement>('[data-tool-search-dialog]');if(!ready||busy||!dialog||dialog.open)return;const input=$<HTMLInputElement>('[data-tool-search]')!;input.value='';renderToolSearch();dialog.showModal();input.focus();}
const analyticalTool = () => !!ui.tool&&!readOnlyTool();
const readOnlyTool = () => ['quality'].includes(ui.tool);
function summaryHTML() {
  const data=previewResult, summary=data ? {op:previewOp,before:result,after:data} : lastSummary;
  if(!summary) {
    const op=operations[cursor-1],step=result.steps[cursor-1];
    return op&&step?`<div class="loom-operation-summary applied"><span class="loom-summary-state" title="${esc(operationDetail(op))}">${t('applied')} · ${operationLabel(op)}</span><span>${t('rowsChanged')} <strong>${number(step.before)} → ${number(step.after)}</strong></span></div>`:'';
  }
  const before=summary.before,after=summary.after,missing=(d:Result)=>d.profile.reduce((n:number,p:any)=>n+p.missing,0);

  return `<div class="loom-operation-summary ${data?'preview':'applied'}"><span class="loom-summary-state">${t(data?'previewReady':'applied')} · ${summary.op ? operationLabel(summary.op):t('filter')}</span>${before.rows.length!==after.rows.length?`<span>${t('rowsChanged')} <strong>${number(before.rows.length)} → ${number(after.rows.length)}</strong></span>`:''}${before.columns.length!==after.columns.length?`<span>${t('columnsChanged')} <strong>${before.columns.length} → ${after.columns.length}</strong></span>`:''}${missing(before)!==missing(after)?`<span>${t('missingChanged')} <strong>${number(missing(before))} → ${number(missing(after))}</strong></span>`:''}</div>`;
}
function defaultFormulaTree(){
  const numeric=result.profile.filter(p=>p.type==='number').map(p=>p.column);
  return {kind:'binary',method:'sub',left:{kind:'column',column:numeric.includes('sales')?'sales':numeric[0]},right:{kind:'column',column:numeric.includes('cost')?'cost':numeric[1]??numeric[0]}};
}
function toolForm() {
  const columns=result.columns,numeric=result.profile.filter(p=>p.type==='number').map(p=>p.column);
  if(!ui.tool||readOnlyTool()||inspecting())return '';
  let content='',advanced='';
  const notes:string[]=[];
  if(extendedTools[ui.tool]) {
    const stored=ui.extended?.[ui.tool]??{};
    const controls=visibleControls(ui.tool,stored);
    const controlHTML=controls.map(control=>{
      if(control.kind==='dataset'){const candidates=datasets.filter(d=>d.id!==active),selected=candidates.some(d=>d.id===stored.dataset)?stored.dataset:candidates[0]?.id??'';return field(control.label,'ext-dataset',candidates.map(d=>`<option value="${esc(d.id)}" ${d.id===selected?'selected':''}>${esc(d.name)}</option>`).join(''));}
      if(control.kind==='rightColumns'){
        const candidates=datasets.filter(d=>d.id!==active),right=candidates.find(d=>d.id===stored.dataset)??candidates[0],keys=stored.rightKeys??((result.index?.names??[]).every((name:string)=>right?.columns.includes(name))?result.index!.names:(result.index?.names.length??1)>1?right?.columns.slice(0,result.index!.names.length)??[]:[]),available=right?.columns.filter(c=>control.param!=='rightColumns'||!keys.includes(c)&&right.rows.every(row=>isMissing(row[c])||isNumber(row[c])))??[],defaults=control.param==='rightKeys'?(ui.tool==='asof'?[right?.columns[0]].filter(Boolean):keys):control.param==='rightBy'?[]:available,current=Array.isArray(stored[control.param])?stored[control.param]:defaults,selected=current.filter((c:string)=>available.includes(c));ui.extended??={};ui.extended[ui.tool]??={};if(stored[control.param]===undefined)ui.extended[ui.tool][control.param]=selected;
        return `<label>${t(control.label)}<select multiple size="3" data-control="ext-${control.param}">${available.map(c=>`<option value="${esc(c)}" ${selected.includes(c)?'selected':''}>${esc(c)}</option>`).join('')}</select></label><div class="loom-column-order">${selected.map((c:string,i:number)=>`<div><span>${esc(c)}</span><button data-right-order="up" data-right-param="${control.param}" data-right-order-index="${i}" ${i===0?'disabled':''}>↑</button><button data-right-order="down" data-right-param="${control.param}" data-right-order-index="${i}" ${i===selected.length-1?'disabled':''}>↓</button></div>`).join('')}</div>`;
      }
      if(['indexLevel','indexLevels','columnLevels'].includes(control.kind??'')){
        const names=(control.kind==='columnLevels'?result.columnIndex?.names:result.index?.names)??[null],ids=names.map((_:any,i:number)=>String(i)),labels=names.map((name:string,i:number)=>`${i}: ${name??t('indexLabel')}`),method=stored.method??'swap';
        if(control.kind==='indexLevel'){const selected=ids.includes(String(stored[control.param]))?String(stored[control.param]):control.param==='right'?ids.at(-1):ids[0];return field(control.label,`ext-${control.param}`,ids.map((id:string,i:number)=>`<option value="${id}" ${selected===id?'selected':''}>${esc(labels[i])}</option>`).join(''));}
        const defaults=['stack','unstack'].includes(ui.tool)?[ids.at(-1)]:ui.tool==='indexLevels'?(method==='reorder'?ids:[ids.at(-1)]):[],current=Array.isArray(stored[control.param])?stored[control.param].map(String):defaults,selected=current.filter((id:string)=>ids.includes(id));
        return `<label>${t(control.label)}<select multiple size="3" data-control="ext-${control.param}">${ids.map((id:string,i:number)=>`<option value="${id}" ${selected.includes(id)?'selected':''}>${esc(labels[i])}</option>`).join('')}</select></label><div class="loom-multi-actions"><button data-multi-action="all" data-multi-param="levels">${t('indexAllLevels')}</button><button data-multi-action="none" data-multi-param="levels">${t('clearAllTables')}</button></div><div class="loom-column-order">${selected.map((id:string,i:number)=>`<div><span>${esc(labels[Number(id)])}</span><button data-index-level-order="up" data-index-level-order-index="${i}" ${i===0?'disabled':''} aria-label="${t('moveUp')} ${esc(labels[Number(id)])}">↑</button><button data-index-level-order="down" data-index-level-order-index="${i}" ${i===selected.length-1?'disabled':''} aria-label="${t('moveDown')} ${esc(labels[Number(id)])}">↓</button></div>`).join('')}</div><p>${t(['stack','unstack'].includes(ui.tool)?'axisLevelHint':'indexLevelOrderHint')}</p>`;
      }
      if(control.kind==='datasets'){const candidates=datasets.filter(d=>d.id!==active),selected=stored[control.param]??candidates.slice(0,1).map(d=>d.id);return `<label>${t(control.label)}<select multiple size="3" data-control="ext-${control.param}">${candidates.map(d=>`<option value="${esc(d.id)}" ${selected.includes(d.id)?'selected':''}>${esc(d.name)}</option>`).join('')}</select></label>`;}
      if(control.kind==='choices'){const current=stored[control.param]??(ui.tool==='dateparts'?['year','month','day']:['sum']);return `<label>${t(control.label)}<select multiple size="4" data-control="ext-${control.param}">${control.options!.map(k=>`<option value="${optionValue(k)}" ${current.includes(optionValue(k))?'selected':''}>${t(k)}</option>`).join('')}</select></label>`;}
      const candidates=['numeric','numerics'].includes(control.kind??'')?numeric:columns;
      const chosen=ui.selectedFields.filter((c:string)=>candidates.includes(c));
      const groupingFields=result.profile.filter(p=>p.type!=='number'&&p.type!=='list'&&p.unique>0&&p.unique<=60).map(p=>p.column),defaultIndex=groupingFields.includes(ui.category)?ui.category:groupingFields[0]??columns[0];
      const reshapeDefaults=['pivotMulti','crosstab'].includes(ui.tool)&&['index','across'].includes(control.param)?[control.param==='index'?defaultIndex:groupingFields.find(c=>c!==defaultIndex)??columns.find(c=>c!==defaultIndex)??columns[0]]:ui.tool==='melt'&&control.param==='columns'?numeric.slice(0,2):null;
      const defaultColumns=ui.tool==='columnRename'?[chosen[0]??columns[0]]:(ui.tool==='explode'?result.profile.filter(p=>p.type==='list').map(p=>p.column):null)??reshapeDefaults??(control.kind==='optionalColumns'?[]:chosen.length?chosen:['groupMulti','windows'].includes(ui.tool)?[numeric[0]??columns[0]]:['columnRename','describe','dedup','dropMissing','transpose','indexLoc','reindex'].includes(ui.tool)?columns:ui.tool==='fill'?[columns.includes('cost')?'cost':numeric[0]??columns[0]]:control.kind==='numerics'?(ui.tool==='topN'?[ui.x||numeric[0]]:numeric.slice(0,12)):[ui.category||columns[0]]);
      const current=stored[control.param]??(ui.tool==='columnRename'&&control.param==='names'?(stored.columns??defaultColumns).map((c:string)=>c+'_renamed').join('\n'):ui.tool==='renameIndex'&&control.param==='names'?(result.index?.names??[null]).map((n:string)=>n??'').join('\n'):['column','numeric'].includes(control.kind??'')?(['dateparse','dateparts','datediff','resample'].includes(ui.tool)&&control.kind==='column'?result.profile.find(p=>p.type==='date')?.column??candidates[0]:(ui.tool==='category'?result.profile.find(p=>p.dtype==='category')?.column??candidates[0]:candidates[0])):['columns','numerics','optionalColumns'].includes(control.kind??'')?defaultColumns:control.options?optionValue(control.options[0]):control.initial??'');
      const name=`ext-${control.param}`;
      if(['columns','numerics','optionalColumns'].includes(control.kind??'')){
        const ordered=(['columns','topN','setIndex','indexLoc','reindex'].includes(ui.tool)||ui.tool==='strings'&&stored.method==='cat')&&control.param==='columns'&&(ui.tool!=='columns'||(stored.mode??'keep')!=='drop'),selected=Array.isArray(current)?current.filter(c=>candidates.includes(c)):[];
        const orderHTML=ordered?`<div class="loom-column-order"><p>${t('columnOrderHint')}</p>${selected.map((column:string,index:number)=>`<div><span>${esc(column)}</span><button data-column-order="up" data-order-index="${index}" ${index===0?'disabled':''} aria-label="${t('moveUp')} ${esc(column)}">↑</button><button data-column-order="down" data-order-index="${index}" ${index===selected.length-1?'disabled':''} aria-label="${t('moveDown')} ${esc(column)}">↓</button></div>`).join('')}</div>`:'';
        return `<label>${t(control.label)}<select multiple size="3" data-control="${name}">${candidates.map(c=>`<option value="${esc(c)}" ${selected.includes(c)?'selected':''}>${esc(c)}</option>`).join('')}</select></label><div class="loom-multi-actions"><button data-multi-action="all" data-multi-param="${control.param}">${t('selectAllColumns')}</button><button data-multi-action="none" data-multi-param="${control.param}">${t('clearColumnSelection')}</button></div>${orderHTML}<p>${t('multiColumnHint')}</p>`;
      }
      if(['column','numeric'].includes(control.kind??''))return field(control.label,name,fieldOptions(candidates,current));
      if(ui.tool==='columnRename'&&control.param==='names'&&(stored.columns??defaultColumns).length===1)return input('newColumn',name,current);
      if(control.kind==='lines')return `<label>${t(control.label)}<textarea rows="4" data-control="${name}">${esc(current)}</textarea></label>`;
      if(control.kind==='range')return `<label>${t(control.label)} <output>${esc(current)}</output><input type="range" min="0" max="5" step="0.1" value="${esc(current)}" data-control="${name}" /></label>`;
      if(control.options)return field(control.label,name,control.options.map(k=>`<option value="${optionValue(k)}" ${optionValue(k)===current?'selected':''}>${t(k)}</option>`).join(''));
      return input(control.label,name,current,control.kind==='number'?'number':'text');
    });
    const advancedNames=advancedParams[ui.tool]??[];
    content=controlHTML.filter((_,i)=>!advancedNames.includes(controls[i].param)).join('');
    advanced=controlHTML.filter((_,i)=>advancedNames.includes(controls[i].param)).join('');
    if(controls.some(c=>['columns','numerics','optionalColumns','choices','rightColumns','datasets','indexLevels','columnLevels'].includes(c.kind??'')))notes.push(t('multiColumnHint'));
  }
  if(['melt','transpose','pivotMulti','crosstab'].includes(ui.tool))notes.push(`<p>${t(({melt:'meltHint',transpose:'transposeHint',pivotMulti:'pivotMultiHint',crosstab:'crosstabHint'} as Record<string,Key>)[ui.tool])}</p>`);
  if(ui.tool==='formula'){
    ui.formula??={name:'computed',output:'append',tree:defaultFormulaTree()};
    const tree=ui.formula.tree,simple=ui.formulaEditor!=='tree';
    const editSelect=(title:Key,path:string,key:string,options:string)=>`<label>${t(title)}<select data-expression-path="${path}" data-expression-key="${key}" data-control="expression-${path||'root'}-${key}">${options}</select></label>`;
    const expression=simple?editSelect('leftField','left','column',fieldOptions(numeric,tree.left?.column))+editSelect('arithmetic','','method',['numericAdd','numericSub','numericMul','numericDiv'].map(k=>`<option value="${optionValue(k)}" ${tree.method===optionValue(k)?'selected':''}>${t(k as Key)}</option>`).join(''))+editSelect('rightField','right','column',fieldOptions(numeric,tree.right?.column)):expressionForm(tree,columns);
    content=`<label>${t('newColumn')}<input data-formula-param="name" data-control="formula-name" value="${esc(ui.formula.name)}"></label><label>${t('formulaEditor')}<select data-formula-editor data-control="formula-editor"><option value="fields" ${simple?'selected':''}>${t('simpleCalculation')}</option><option value="tree" ${!simple?'selected':''}>${t('expressionEditor')}</option></select></label>${expression}`;
    advanced=`<label>${t('groupOutput')}<select data-formula-param="output" data-control="formula-output"><option value="append" ${ui.formula.output==='append'?'selected':''}>${t('numericAppend')}</option><option value="overwrite" ${ui.formula.output==='overwrite'?'selected':''}>${t('numericOverwrite')}</option></select></label>`;
    notes.push(t('formulaHint'));
  }
  if(['indexLoc','reindex','indexAssign'].includes(ui.tool)){content+=indexQueryForm(result.index??rangeIndex(result.rows.length),currentIndexQuery(),ui.tool,ui.tool!=='reindex'?(ui.extended?.[ui.tool]?.mode??'labels'):'labels');if(ui.tool==='indexAssign')content+=`<p>${t('indexAssignHint')}</p>`;if(ui.tool==='reindex')content+=`<p>${t('indexReindexHint')}</p>`;}
  if(ui.tool==='groupMulti'&&ui.extended?.groupMulti?.specMode==='named'){ui.namedSpecs??=[{column:numeric[0]??columns[0],method:'sum',name:'total'}];content+=namedAggregationForm(columns,ui.namedSpecs);}
  if(ui.tool==='asof')notes.push(`<p>${t('asofHint')}</p>`);
  if(['indexJoin','indexConcat','indexArithmetic'].includes(ui.tool))notes.push(`<p>${t('indexAlignmentHint')}</p>${ui.tool==='indexArithmetic'?`<p>${t('indexArithmeticHint')}</p>`:''}`);
  if(ui.tool==='indexLevels')notes.push(`<p>${t('indexLevelsHint')}</p>`);
  if(['setIndex','resetIndex','sortIndex','renameIndex'].includes(ui.tool))notes.push(`<p>${t('indexHint')}</p>`);
  if(ui.tool==='groupFilter')notes.push(`<p>${t('groupFilterHint')}</p>`);
  if(ui.tool==='groupRank')notes.push(`<p>${t('groupRankHint')}</p>`);
  if(ui.tool==='ewm')notes.push(`<p>${t('ewmHint')}</p>`);
  if(['dateparse','dateparts','datediff','resample'].includes(ui.tool))notes.push(`<p>${esc(t('datetimeHint'))}</p>`);
  if(ui.tool==='resample')notes.push(`<p>${t('resampleHint')}</p>`);
  if(ui.tool==='binning')notes.push(`<p>${t('binHint')}</p>`);
  if(ui.tool==='sampling')notes.push(`<p>${t('samplingHint')}</p>`);
  if(ui.tool==='numeric')notes.push(`<p>${t('numericHint')}</p>`);
  if(ui.tool==='strings')notes.push(`<p>${esc(t('stringHint'))}</p>`);
  if(ui.tool==='windows')notes.push(`<p>${t('windowHint')}</p>`);
  if(ui.tool==='merge'){ui.merge??={};ui.merge.advancedOpen=!!ui.editorDetails?.merge?.advanced;content=mergeForm(columns,datasets,active,ui.merge);notes.push(t('mergeHint'));}
  if(ui.tool==='concat')notes.push(`<p>${t('concatHint')}</p>`);
  if(ui.tool==='sort')content=sortForm(ui.sortKeys??[{column:ui.sortColumn??columns[0],desc:ui.sortDirection==='descending'}],columns,ui.sortMissing??'last');
  if(ui.tool==='filterTree')content=queryForm(ui.conditionTree??{mode:'and',children:[newCondition(columns[0])]},columns);
  if(ui.tool==='groupMulti')notes.push(`<p class="loom-help">${t(ui.extended?.groupMulti?.specMode==='named'?'namedAggHint':'groupMultiHint')}</p>`);
  if(['fill','rowSelect','topN'].includes(ui.tool))notes.push(`<p class="loom-help">${t(ui.tool==='fill'?'fillOrderHint':ui.tool==='rowSelect'?'rowSelectHint':'topNHint')}</p>`);
  return `<section class="loom-editor" data-editor-tool="${ui.tool}"><div class="loom-editor-heading"><strong>${t(toolKey(ui.tool))}</strong>${button('cancel-tool','close')}</div><div class="loom-editor-body"><div class="loom-tool-form">${content}</div>${advanced?`<details class="loom-advanced" data-editor-details="advanced" ${ui.editorDetails?.[ui.tool]?.advanced?'open':''}><summary>${t('advancedOptions')}</summary><div class="loom-tool-form">${advanced}</div></details>`:''}${notes.length?`<details class="loom-tool-help" data-editor-details="help" ${ui.editorDetails?.[ui.tool]?.help?'open':''}><summary>${t('toolHelp')}</summary>${notes.map(note=>note.startsWith('<p')?note:`<p>${esc(note)}</p>`).join('')}</details>`:''}</div><div class="loom-editor-footer"><span data-preview-status role="status"></span>${button('apply-tool','apply',true)}</div></section>`;
}
function overviewHTML(data:Result) {
  const numeric=data.profile.filter(p=>p.type==='number').map(p=>p.column),cats=data.profile.filter(p=>p.type!=='number'&&p.type!=='list'&&p.unique<=60&&p.unique>0).map(p=>p.column);
  return `<p class="loom-chart-note">${t(previewResult?'chartLocked':'chartHint')}</p><div class="loom-chart-grid"><section class="loom-card"><div class="loom-card-heading"><h2>${t('distribution')}</h2><select data-control="chart-x" aria-label="${t('x')}">${fieldOptions(numeric,ui.x)}</select></div><div class="loom-chart" data-chart="histogram"></div></section><section class="loom-card"><div class="loom-card-heading"><h2>${t('categories')}</h2><select data-control="chart-category" aria-label="${t('category')}">${fieldOptions(cats,ui.category)}</select></div><div class="loom-chart" data-chart="category"></div></section><section class="loom-card wide"><div class="loom-card-heading"><h2>${t('relationship')}</h2><div>${field('x','scatter-x',fieldOptions(numeric,ui.x))}${field('y','scatter-y',fieldOptions(numeric,ui.y))}</div></div><div class="loom-chart" data-chart="scatter"></div><p class="loom-help">${t('samplePoints')}</p></section></div>`;
}
function qualityHTML(data:Result){return `<section class="loom-card"><h2>${t('qualityTitle')}</h2><p class="loom-help">${t('qualityHint')}</p><div class="loom-quality-rates">${data.profile.map(p=>`<div class="loom-field-stat"><div><span>${esc(p.column)}</span><span>${number(p.missing)} / ${number(data.rows.length)}</span></div><div class="loom-progress"><span style="width:${data.rows.length?p.missing/data.rows.length*100:0}%"></span></div></div>`).join('')}</div><h3>${t('qualityMap')}</h3><p class="loom-help">${t('qualityMapHint')}</p><div class="loom-quality" data-chart="quality"></div></section>`;}
function render() {
  if(!root||!ready)return;
  root.classList.toggle('sidebar-hidden',!!ui.sidebarHidden);
  root.classList.toggle('has-side-editor',analyticalTool()&&!inspecting());
  syncDefaultResultMode();
  const previousEditor=$<HTMLElement>('[data-editor-tool]'),previousTool=previousEditor?.dataset.editorTool;
  const editorScroll=previousEditor?.querySelector('.loom-editor-body')?.scrollTop??0;
  if(previousTool){
    ui.editorDetails??={};ui.editorDetails[previousTool]??={};
    previousEditor!.querySelectorAll<HTMLDetailsElement>('[data-editor-details]').forEach(details=>ui.editorDetails[previousTool][details.dataset.editorDetails!]=details.open);
  }
  root.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(control=>control.disabled=false);
  const focused=root.contains(document.activeElement)?document.activeElement as HTMLInputElement|HTMLTextAreaElement:null;
  const focusName=focused?.dataset.control;
  const caret=focused&&(focused.tagName==='TEXTAREA'||focused.tagName==='INPUT'&&focused.type==='text')?focused.selectionStart:null;
  const shown=shownResult(), rows=visibleRows();
  $('[data-current-source]')!.textContent=source().name;
  $('[data-datasets]')!.innerHTML=datasets.map(d=>`<button class="loom-dataset ${d.id===active?'active':''}" data-dataset="${esc(d.id)}">${esc(d.name)}</button>`).join('');
  $('[data-dataset-count]')!.textContent=String(datasets.length);
  renderFields();
  $('[data-column-count]')!.textContent=String(result.columns.length);
  $('[data-step-count]')!.textContent=String(operations.length+1);
  $('[data-current-source]')!.title=source().id.startsWith('demo-')?t('sample'):source().name;
  $('[data-sections]')!.innerHTML=Object.entries(sectionLabels).map(([id,key])=>`<button data-section="${id}" class="${ui.section===id?'active':''}" aria-pressed="${ui.section===id}">${t(key)}</button>`).join('');
  $('[data-tools]')!.innerHTML=sectionTools[ui.section].map((group,i)=>{
    const current=group.tools.find(tool=>ui.tool===tool);
    if(group.tools.length===1){const tool=group.tools[0];return `<button data-tool="${tool}" ${inspecting()?'disabled':''} aria-pressed="${ui.tool===tool}" class="loom-tool-direct ${current?'active':''}">${t(toolKey(tool))}</button>`;}
    return `<div class="loom-tool-dropdown"><button data-tool-menu="${i}" aria-expanded="false" aria-controls="loom-tool-menu-${i}" class="loom-tool-trigger ${current?'active':''}"><span>${t(current?toolKey(current):group.label)}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div id="loom-tool-menu-${i}" popover="auto" data-tool-menu-panel="${i}" class="loom-tool-menu">${group.tools.map(tool=>`<button data-tool="${tool}" ${inspecting()?'disabled':''} aria-pressed="${ui.tool===tool}" class="${ui.tool===tool?'active':''}">${t(toolKey(tool))}</button>`).join('')}</div></div>`;
  }).join('');
  for(const panel of root.querySelectorAll<HTMLDetailsElement>('[data-panel]'))panel.open=ui.panels[panel.dataset.panel!]??false;
  $('[data-editor]')!.innerHTML=toolForm();
  if(previousTool===ui.tool){const body=$<HTMLElement>('.loom-editor-body');if(body)body.scrollTop=editorScroll;}
  $('[data-operation-summary]')!.innerHTML=inspecting()?'':summaryHTML();
  const missing=shown.profile.reduce((n,p)=>n+p.missing,0);
  $('[data-metrics]')!.innerHTML=`<span><strong>${number(shown.rows.length)}</strong> ${t('rows')}</span><span><strong>${shown.columns.length}</strong> ${t('columns')}</span><span><strong>${number(missing)}</strong> ${t('missing')}</span>`;
  $('[data-result-modes]')!.innerHTML=previewResult?['before','after','compare'].map(mode=>`<button data-result-mode="${mode}" aria-pressed="${ui.resultMode===mode}" class="${ui.resultMode===mode?'active':''}">${t(mode==='compare'?'compare':mode==='before'?'resultBefore':'resultAfter')}</button>`).join(''):'';
  root.querySelectorAll<HTMLButtonElement>('[data-view-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.viewMode===ui.view);b.setAttribute('aria-pressed',String(b.dataset.viewMode===ui.view));});
  $('[data-history-notice]')!.innerHTML=inspecting()?`<div class="loom-history-notice"><div><strong>${t('viewingHistory')} ${viewCursor()+1} / ${operations.length+1}</strong><p>${t('historyReadOnly')}</p></div><div>${button('return-latest','returnLatest')}${button('continue-here','continueHere',true)}</div></div>`:'';
  $('[data-selection]')!.innerHTML=selectionHTML();
  let html='';
  if(previewResult&&ui.resultMode==='compare'){
    html=`<div class="loom-comparison">${[result,previewResult].map((d,i)=>`<section class="loom-card" data-comparison-side="${i}"><h2>${t(i?'resultAfter':'resultBefore')}</h2><div class="loom-diff-stats"><strong>${number(d.rows.length)}</strong> ${t('rows')} <strong>${number(d.profile.reduce((n,p)=>n+p.missing,0))}</strong> ${t('missing')}</div>${ui.view==='data'?table(d.rows,d.columns,false,12,{},d.index,d.columnIndex):i===1&&d.analysis?statisticsHTML(d,pairDetail,pairPending):`<div class="loom-chart" data-chart="compare-${i}"></div>`}</section>`).join('')}</div>`;
  }else if(ui.view==='data'){
    const pages=Math.max(1,Math.ceil(rows.length/50));ui.page=Math.min(ui.page,pages-1);
    html=`<p class="loom-help">${t('sortHint')}</p>${table(rows.slice(ui.page*50),shown.columns,!inspecting()&&!previewResult,50,shown.analysis?.columnLabels,indexForRows(shown,rows.slice(ui.page*50)),shown.columnIndex)}<div class="loom-pagination">${button('previous','previous')}<span>${ui.page+1} / ${pages}</span>${button('next','next')}</div>`;
  }else if(shown.analysis&&!readOnlyTool())html=statisticsHTML(shown,pairDetail,pairPending);
  else if(ui.tool==='quality'||['fill','dropMissing','dedup'].includes(ui.tool))html=qualityHTML(shown);
  else html=overviewHTML(shown);
  $('[data-view]')!.innerHTML=html;
  const selectedStep=viewCursor();
  $('[data-history]')!.innerHTML=`<button data-step="0" class="loom-step ${selectedStep===0?'active':''}"><span>1</span><div><strong>${t('original')}</strong><small>${number(source().rows.length)} ${t('rows')}</small></div></button>`+operations.map((op,i)=>`<div class="loom-step-wrap"><button data-step="${i+1}" class="loom-step ${selectedStep===i+1?'active':''} ${i>=cursor?'future':''}"><span>${i+2}</span><div><strong>${operationLabel(op)}</strong><small>${esc(operationDetail(op))}</small></div>${i+1===cursor?'<i></i>':''}</button><details class="loom-step-detail"><summary>${t('details')}</summary>${result.steps[i]?`<p>${number(result.steps[i].before)} → ${number(result.steps[i].after)} ${t('rows')}</p>`:''}</details></div>`).join('');
  const branches=source().branches??[];
  $('[data-branches]')!.innerHTML=branches.length?`<label class="loom-branch-select">${t('branches')}<select data-branch-select><option value="">${t('restoreBranch')}</option>${branches.map((b,i)=>`<option value="${esc(b.id)}">${t('branch')} ${i+1} · ${b.cursor+1} ${t('history')}</option>`).join('')}</select></label>`:'';
  $<HTMLButtonElement>('[data-action="undo"]')!.disabled=cursor===0||inspecting();$<HTMLButtonElement>('[data-action="redo"]')!.disabled=cursor===operations.length||inspecting();
  const toggle=$<HTMLButtonElement>('[data-action="toggle-sidebar"]')!;const toggleLabel=t(ui.sidebarHidden?'expandSidebar':'collapseSidebar');toggle.querySelector('[data-sidebar-toggle-label]')!.textContent=toggleLabel;toggle.setAttribute('aria-label',toggleLabel);toggle.title=toggleLabel;toggle.setAttribute('aria-expanded',String(!ui.sidebarHidden));
  const search=$<HTMLInputElement>('[data-field-search]');if(search)search.value=ui.fieldSearch??'';
  root.querySelectorAll('input,select,textarea').forEach(c=>c.setAttribute('data-loom-control',''));
  if(busy)root.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(control=>control.disabled=true);
  root.setAttribute('aria-busy',String(busy));showNotice(notice);updateStatus();updatePreviewStatus();
  if(focusName){const next=$<HTMLInputElement|HTMLTextAreaElement>(`[data-control="${focusName}"]`);next?.focus({preventScroll:true});if(caret!==null&&next&&(next.tagName==='TEXTAREA'||next.tagName==='INPUT'&&next.type==='text'))next.setSelectionRange(caret,caret);}
  requestAnimationFrame(drawCharts);
}
function renderFields(){
  if(!root)return;const query=String(ui.fieldSearch??'').toLowerCase();const summary=$('[data-index-summary]');if(summary){summary.hidden=!result.index?.explicit;summary.textContent=result.index?.explicit?`${t('indexLabel')}: ${result.index.names.map((name:string,i:number)=>name??`${t('indexLabel')} ${i+1}`).join(' → ')}`:'';}
  $('[data-fields]')!.innerHTML=result.profile.filter(p=>p.column.toLowerCase().includes(query)).map(p=>`<button class="loom-field ${ui.selectedFields.includes(p.column)?'active':''}" data-field="${esc(p.column)}" aria-pressed="${ui.selectedFields.includes(p.column)}" title="${t(p.type)}${p.dtype?' · '+p.dtype:''}"><span class="loom-type ${p.type}">${p.type==='number'?'#':p.type==='date'?'◷':p.type==='list'?'[]':p.type==='category'?'≡':'Aa'}</span><span>${esc(p.column)}${p.dtype?` <small>${esc(p.dtype)}</small>`:''}</span></button>`).join('');
}
function operationDetail(op:Operation){
  const p=op.params;
  if(['indexLoc','reindex','indexAssign'].includes(op.type))return `${p.mode==='slice'?`${(p.start??[]).join(' / ')} → ${(p.end??[]).join(' / ')} · ${p.step??1}`:`${p.labels?.length??0} ${t('indexTarget')}: ${(p.labels??[]).slice(0,3).map((tuple:any[])=>tuple.map(v=>v??'∅').join(' / ')).join(', ')}`} · ${p.method??p.mode??'labels'}`;
  if(op.type==='groupMulti'&&p.specs)return `${(p.keys??[]).join(', ')} · ${p.specs.map((s:any)=>`${s.name} = ${s.method}(${s.column})`).join(' · ')}`;
  if(op.type==='formula')return `${p.name} = ${expressionSummary(p.tree)}`;
  if(op.type==='merge')return `${t(p.how as Key)} · ${(p.pairs??[]).map((pair:any)=>`${pair.left} ↔ ${pair.right}`).join(', ')}`;
  if(op.type==='filterTree')return conditionSummary(p.tree);
  if(op.type==='filter')return `${p.exclude?t('excludeSelected')+' · ':''}${t(p.mode==='or'?'or':'and')}: ${p.filters.map(filterDescription).join('; ')}`;
  if(op.type==='sort')return p.keys.map((k:any)=>`${k.column} ${t(k.desc?'descending':'ascending')}`).join(' → ');
  return extendedTools[op.type]?.controls.filter(c=>p[c.param]!==undefined&&p[c.param]!=='').map(c=>{
    const value=p[c.param],option=c.options?.find(k=>optionValue(k)===value);
    return `${t(c.label)}: ${option?t(option):Array.isArray(value)?value.join(', '):value}`;
  }).join(' · ')??'';
}
function operationLabel(op:Operation){return esc(t(toolKey(op.type)));}

function chart(selector: string) {
  const element = $<HTMLElement>(selector); if (!element) return null;
  element.replaceChildren();
  const width = Math.max(200,element.clientWidth), height=element.clientHeight||220;
  return { element, svg: d3.select(element).append('svg').attr('viewBox',`0 0 ${width} ${height}`), width, height, m:{left:44,right:14,top:12,bottom:30} };
}
function addChartFilter(f: Filter) { if(busy||previewResult||inspecting())return; ui.filters = [...ui.filters.filter((existing: Filter)=>existing.column!==f.column),f]; ui.page=0; invalidatePreview(); scheduleSave(); render(); }
function drawCharts() {
  if(!root||!ready)return;
  const result=shownResult(),selected=previewResult?result.rows:selectedRows(result),selectedSet=new Set(selected);
  const hist=chart('[data-chart="histogram"]');
  if(hist) {
    const data=result.rows.map(r=>r[ui.x]).filter(isNumber) as number[];
    if(!data.length)hist.element.innerHTML=`<p class="loom-empty">${t('noNumeric')}</p>`;
    else {
      drawNumericDistribution(hist,data,data,undefined,true);
    }
  }
  const cat=chart('[data-chart="category"]');
  if(cat){
    if(!ui.category)cat.element.innerHTML=`<p class="loom-empty">${t('noCategory')}</p>`;
    else{
      const counts=Array.from(d3.rollup(result.rows,r=>r.length,r=>label(r[ui.category]))).sort((a,b)=>b[1]-a[1]).slice(0,12);
      const x=d3.scaleBand<string>().domain(counts.map(([k])=>k)).range([cat.m.left,cat.width-cat.m.right]).padding(.35),y=d3.scaleLinear().domain([0,d3.max(counts,d=>d[1])||1]).nice().range([cat.height-cat.m.bottom,cat.m.top]);
      cat.svg.append('g').attr('transform',`translate(0,${cat.height-cat.m.bottom})`).call(d3.axisBottom(x).tickFormat(v=>v.length>11?v.slice(0,10)+'…':v));
      cat.svg.append('g').attr('transform',`translate(${cat.m.left},0)`).call(d3.axisLeft(y).ticks(4));
      const selectCategory=(k:string)=>addChartFilter({column:ui.category,operator:k==='∅'&&!result.rows.some(r=>r[ui.category]==='∅')?'missing':'eq',value:k==='∅'&&!result.rows.some(r=>r[ui.category]==='∅')?undefined:k});
      cat.svg.selectAll('rect').data(counts).join('rect').attr('class','bar').attr('x',d=>x(d[0])!).attr('y',d=>y(d[1])).attr('width',x.bandwidth()).attr('height',d=>y(0)-y(d[1])).attr('opacity',d=>ui.filters.length&&!selected.some(r=>label(r[ui.category])===d[0])?.25:1).attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d[0]}: ${d[1]}`).on('click',(_,d)=>selectCategory(d[0])).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCategory(d[0]);}}).append('title').text(d=>`${d[0]}: ${d[1]}`);
    }
  }
  const scatter=chart('[data-chart="scatter"]');
  if(scatter){
    const valid=result.rows.filter(r=>isNumber(r[ui.x])&&isNumber(r[ui.y])),points=valid.filter((_,i)=>i%Math.max(1,Math.ceil(valid.length/1500))===0);
    if(!valid.length)scatter.element.innerHTML=`<p class="loom-empty">${t('noNumeric')}</p>`;
    else {
      const domain=(c:string)=>{const [a,b]=d3.extent(valid,r=>r[c]) as [number,number];return a===b?[a-.5,b+.5]:[a,b];};
      const x=d3.scaleLinear().domain(domain(ui.x)).nice().range([scatter.m.left,scatter.width-scatter.m.right]),y=d3.scaleLinear().domain(domain(ui.y)).nice().range([scatter.height-scatter.m.bottom,scatter.m.top]);
      scatter.svg.append('g').attr('transform',`translate(0,${scatter.height-scatter.m.bottom})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('~s')));
      scatter.svg.append('g').attr('transform',`translate(${scatter.m.left},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('~s')));
      scatter.svg.selectAll('circle').data(points).join('circle').attr('class','dot').attr('cx',r=>x(r[ui.x])).attr('cy',r=>y(r[ui.y])).attr('r',3.5).attr('opacity',r=>ui.filters.length&&!selectedSet.has(r)?.16:1).append('title').text(r=>`${ui.x}: ${number(r[ui.x])}\n${ui.y}: ${number(r[ui.y])}`);
      const brush=d3.brush().extent([[scatter.m.left,scatter.m.top],[scatter.width-scatter.m.right,scatter.height-scatter.m.bottom]]).on('end',event=>{
        if(!event.sourceEvent||!event.selection||busy||previewResult||inspecting())return;
        const [[a,b],[c,d]]=event.selection;ui.filters=ui.filters.filter((f:Filter)=>f.column!==ui.x&&f.column!==ui.y);
        ui.filters.push({column:ui.x,operator:'range',value:x.invert(a),upper:x.invert(c)});
        if(ui.y!==ui.x)ui.filters.push({column:ui.y,operator:'range',value:y.invert(d),upper:y.invert(b)});
        ui.mode='and';ui.page=0;scheduleSave();render();
      });scatter.svg.append('g').call(brush);
    }
  }
  const quality=$('[data-chart="quality"]');
  if(quality){quality.replaceChildren();const cols=result.columns.slice(0,30),rows=result.rows.slice(0,100),w=Math.max(240,quality.clientWidth),cw=(w-60)/Math.max(1,cols.length);const svg=d3.select(quality).append('svg').attr('viewBox',`0 0 ${w} 160`);cols.forEach((c,i)=>{svg.append('text').attr('x',60+i*cw).attr('y',12).text(c.slice(0,9));rows.forEach((r,j)=>svg.append('rect').attr('x',60+i*cw).attr('y',22+j*1.3).attr('width',Math.max(1,cw-2)).attr('height',1.1).attr('class',isMissing(r[c])?'q-missing':'q-present').append('title').text(`${j+1} · ${c}: ${label(r[c])}`));});svg.append('text').attr('x',0).attr('y',30).text('1');svg.append('text').attr('x',0).attr('y',150).text(String(rows.length));}
  if(previewResult&&ui.resultMode==='compare')drawComparison();
  else drawStatistics(root,result,pairDetail);
}
function drawNumericDistribution(c:NonNullable<ReturnType<typeof chart>>,values:number[],reference=values,peer?:number[],interactive=false){
  const spec=numericDistribution(values,reference),bars=spec.bars;
  const band=spec.discrete?d3.scaleBand<number>().domain(bars.map(b=>b.value!)).range([c.m.left,c.width-c.m.right]).padding(.3):null;
  const x=d3.scaleLinear().domain(spec.domain).range([c.m.left,c.width-c.m.right]);
  const max=Math.max(1,...bars.map(b=>b.count),...(peer?numericDistribution(peer,reference).bars.map(b=>b.count):[]));
  const y=d3.scaleLinear().domain([0,max]).nice().range([c.height-c.m.bottom,c.m.top]);
  const axis=c.svg.append('g').attr('transform',`translate(0,${c.height-c.m.bottom})`);
  if(band)axis.call(d3.axisBottom(band).tickFormat(value=>String(value)));
  else axis.call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('~s')));
  c.svg.append('g').attr('transform',`translate(${c.m.left},0)`).call(d3.axisLeft(y).ticks(Math.min(4,max)).tickFormat(d3.format('d')));
  const barX=(b:typeof bars[number])=>band?band(b.value!)!:x(b.lower)+1;
  const barWidth=(b:typeof bars[number])=>band?band.bandwidth():Math.max(1,x(b.upper)-x(b.lower)-2);
  const label=(b:typeof bars[number])=>`${band?String(b.value):number(b.lower)+'–'+number(b.upper)}: ${b.count}`;
  const rects=c.svg.selectAll<SVGRectElement,typeof bars[number]>('rect').data(bars).join('rect').attr('class','bar').attr('x',barX).attr('y',b=>y(b.count)).attr('width',barWidth).attr('height',b=>y(0)-y(b.count));
  if(interactive){
    const chosen=selectedRows().map(row=>row[ui.x]).filter(isNumber);
    const choose=(b:typeof bars[number])=>addChartFilter(band?{column:ui.x,operator:'eq',value:b.value}:{column:ui.x,operator:'range',value:b.lower,upper:b.upper});
    rects.attr('opacity',b=>ui.filters.length&&!chosen.some(v=>band?v===b.value:v>=b.lower&&v<=b.upper)?.25:1).attr('tabindex',0).attr('role','button').attr('aria-label',label).on('click',(_,b)=>choose(b)).on('keydown',(event,b)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(b);}});
  }
  rects.append('title').text(label);
  if(band)c.svg.selectAll('text.loom-distribution-count').data(bars).join('text').attr('class','loom-distribution-count').attr('x',b=>barX(b)+barWidth(b)/2).attr('y',b=>y(b.count)-5).attr('text-anchor','middle').text(b=>String(b.count));
}
function drawComparison(){
  if(!previewResult)return;
  [result,previewResult].forEach((data,i)=>{
    if(i===1&&ui.view==='overview'&&data.analysis){
      const panel=$<HTMLElement>(`[data-comparison-side="${i}"]`);
      if(panel)drawStatistics(panel,data,pairDetail);
      return;
    }
    const c=chart(`[data-chart="compare-${i}"]`);if(!c)return;
    const names=data.columns.filter(k=>data.profile.find(p=>p.column===k)?.type==='number');
    const preferred=previewOp?.params.column??ui.x;
    const field=names.includes(preferred)?preferred:names.includes(ui.x)?ui.x:names[0];
    if(!field){c.element.innerHTML=table(data.rows,data.columns,false,8);return;}
    const all=[...result.rows,...previewResult!.rows].map(r=>r[field]).filter(isNumber) as number[];
    drawNumericDistribution(c,data.rows.map(r=>r[field]).filter(isNumber),all,[result,previewResult][1-i]!.rows.map(r=>r[field]).filter(isNumber));
    c.svg.append('text').attr('x',c.m.left).attr('y',10).text(field);
  });
}
function currentIndexQuery(){ui.indexQueries??={};const index=result.index??rangeIndex(result.rows.length);ui.indexQueries[ui.tool]=ensureIndexQuery(index,ui.indexQueries[ui.tool]);return ui.indexQueries[ui.tool];}
function indexQueryCell(target:HTMLElement){const query=currentIndexQuery(),row=target.dataset.indexQueryRow!,cells=['start','end'].includes(row)?query[row]:query.rows[Number(row)];return cells?.[Number(target.dataset.indexQueryLevel)];}
function formOperation():Operation{
  if(ui.tool==='formula')return {type:'formula',params:structuredClone(ui.formula)};
  if(ui.tool==='merge'){const m=ui.merge;return {type:'merge',params:{dataset:m.dataset,pairs:structuredClone(m.pairs),how:m.how??'left',validate:m.validate??'many_to_many',suffixes:[m.leftSuffix??'_x',m.rightSuffix??'_y'],indicator:m.indicator??'_merge',sort:m.order==='sortedGroups'}};}
  if(extendedTools[ui.tool]){
    const params:any={};for(const control of visibleControls(ui.tool,ui.extended?.[ui.tool]??{})){const el=$<HTMLSelectElement>(`[data-control="ext-${control.param}"]`);params[control.param]=['columns','numerics','optionalColumns','choices','datasets','indexLevels','columnLevels','rightColumns'].includes(control.kind??'')?Array.from(el?.selectedOptions??[],o=>o.value):el?.value??'';}
    if(['indexJoin','indexConcat','indexArithmetic','asof'].includes(ui.tool)){for(const param of ['rightKeys','rightColumns','rightBy'])if(Array.isArray(params[param])){const ordered=ui.extended?.[ui.tool]?.[param]??[];params[param]=[...ordered.filter((c:string)=>params[param].includes(c)),...params[param].filter((c:string)=>!ordered.includes(c))];}}
    if(['resetIndex','sortIndex','indexLevels','stack','unstack'].includes(ui.tool)){const ordered=ui.extended?.[ui.tool]?.levels;if(Array.isArray(params.levels)){const selected=params.levels.map(String);params.levels=(Array.isArray(ordered)?[...ordered.map(String).filter((id:string)=>selected.includes(id)),...selected.filter((id:string)=>!ordered.map(String).includes(id))]:selected).map(Number);}if(ui.tool==='indexLevels'&&params.method==='swap'){params.left=Number(params.left);params.right=Number(params.right);}}
    if(['columns','topN','setIndex','indexLoc','reindex'].includes(ui.tool)||ui.tool==='strings'&&params.method==='cat'){const ordered=ui.extended?.[ui.tool]?.columns;if(Array.isArray(ordered))params.columns=[...ordered.filter((c:string)=>params.columns.includes(c)),...params.columns.filter((c:string)=>!ordered.includes(c))];}
    if(['indexLoc','reindex','indexAssign'].includes(ui.tool)){Object.assign(params,indexQueryParams(currentIndexQuery(),result.index??rangeIndex(result.rows.length),ui.tool!=='reindex'?params.mode:'labels'));if(ui.tool==='indexAssign'){params.value=decodeIndexCell({type:params.valueType,value:params.value},result.index??rangeIndex(result.rows.length),0);delete params.valueType;}if(ui.tool==='reindex'){const extra=String(params.extraColumns??'').split(/\r?\n/).map(c=>c.trim()).filter(Boolean);if(new Set(extra).size!==extra.length)throw new Error('duplicateColumns');params.columns=[...new Set([...params.columns,...extra])];params.fillValue=decodeIndexCell({type:params.fillType,value:params.fillValue},result.index??rangeIndex(result.rows.length),0);delete params.extraColumns;delete params.fillType;}}
    if(ui.tool==='groupMulti'){if(params.specMode==='named')params.specs=structuredClone(ui.namedSpecs);delete params.specMode;}
    if(ui.tool==='concat')params.currentName=source().name;
    if(ui.tool==='correlation')params.ddof=params.ddof||'1';
    return {type:ui.tool,params};
  }
  if(ui.tool==='filterTree')return {type:'filterTree',params:{tree:structuredClone(ui.conditionTree)}};
  if(ui.tool==='sort')return {type:'sort',params:{keys:structuredClone(ui.sortKeys),missing:ui.sortMissing??'last'}};
  throw new Error('invalidOperation');
}
function pendingOperations(op?:Operation){return [...operations.slice(0,cursor),...(op?[op]:[])];}
function updatePreviewStatus(state?:Key){
  const status=$('[data-preview-status]');if(status)status.textContent=t(state??(previewResult?'previewReady':'previewPending'));
  const apply=$<HTMLButtonElement>('[data-action="apply-tool"]');if(apply)apply.disabled=!previewResult||busy;
}
function invalidatePreview(){pairDetail=null;pairPending=false;pairToken++;previewToken++;previewResult=null;previewOp=null;$('[data-operation-summary]')?.replaceChildren();updatePreviewStatus();}
function requestPreview(delay=220){
  clearTimeout(previewTimer);invalidatePreview();if(!ui.tool||readOnlyTool()||inspecting())return;
  const token=previewToken;updatePreviewStatus('previewUpdating');previewTimer=setTimeout(()=>void previewTool(token),delay);
}
async function previewTool(token=previewToken){
  if(!ui.tool||readOnlyTool()||inspecting())return;
  const dataset=source();
  try{const op=formOperation(),base=pendingOperations(op),computed=await compute('replay',{dataset,operations:base,cursor:base.length,datasets});if(token!==previewToken||dataset.id!==active)return;previewResult=computed;previewOp=op;showNotice('');render();}
  catch(error){if(token!==previewToken)return;previewResult=null;previewOp=null;showNotice((error as Error).message);render();updatePreviewStatus('invalidPreview');}
}
async function perform(op?:Operation){
  pairDetail=null;pairPending=false;pairToken++;
  if(busy||inspecting())return;busy=true;previewToken++;clearTimeout(previewTimer);render();
  try{
    const next=pendingOperations(op),computed=await compute('replay',{dataset:source(),operations:next,cursor:next.length,datasets});
    if(cursor<operations.length)source().branches=preserveBranch(source().branches??[],operations,cursor,t('branch'),crypto.randomUUID());
    lastSummary={op,before:result,after:computed};operations=next;cursor=next.length;result=computed;ui.filters=[];ui.page=0;ui.inspect=null;ui.tool='';previewResult=null;previewOp=null;normalizeFields();showNotice('');scheduleSave();
  }catch(error){showNotice((error as Error).message);}finally{busy=false;render();}
}
function cancelTool(){clearTimeout(previewTimer);invalidatePreview();ui.tool='';ui.filters=[];ui.page=0;scheduleSave();render();}
async function openTool(tool:string){
  resultModeManual=false;
  if(inspecting())return;clearTimeout(previewTimer);invalidatePreview();ui.tool=tool;lastSummary=null;ui.filters=[];
  if(tool==='filterTree'&&!ui.conditionTree)ui.conditionTree={mode:'and',children:[newCondition(result.columns[0])]};
  if(tool==='sort')ui.sortKeys=Array.isArray(ui.sortKeys)?ui.sortKeys.filter((key:any)=>result.columns.includes(key.column)):[];
  if(tool==='sort'&&!ui.sortKeys?.length)ui.sortKeys=[{column:result.columns[0],desc:false}];
  scheduleSave();render();
  const editor=$('[data-editor]');
  if(analyticalTool()&&editor&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    editor.getAnimations().forEach(animation=>animation.cancel());
    editor.animate([
      {transform:'translateX(8px)',opacity:.65,boxShadow:'inset 3px 0 0 var(--accent)'},
      {transform:'translateX(0)',opacity:1,boxShadow:'inset 3px 0 0 transparent'},
    ],{duration:280,easing:'cubic-bezier(.2,.7,.3,1)'});
  }
  if(!readOnlyTool())requestPreview(0);
}
function download(content: string, filename: string, type='application/json') { const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000); }
let pendingImports:Dataset[]=[],importing=false,importGeneration=0;
let cancelWorkbook:(()=>void)|null=null,urlAbort:AbortController|null=null;
function cancelImport(){importGeneration++;cancelWorkbook?.();urlAbort?.abort();pendingImports=[];showImportChoices();}
function workbookRead(buffer:ArrayBuffer,parquet=false){return new Promise<any>((resolve,reject)=>{const parser=parquet?new ParquetWorker():new ExcelWorker(),cleanup=()=>{clearTimeout(timer);parser.terminate();cancelWorkbook=null;},timer=setTimeout(()=>{cleanup();reject(new Error(parquet?'parquetExpandedLimit':'workbookExpandedLimit'));},60000);cancelWorkbook=()=>{cleanup();reject(new Error('importCancelled'));};parser.onmessage=e=>{cleanup();e.data.error?reject(new Error(e.data.error)):resolve(e.data.result);};parser.onerror=()=>{cleanup();reject(new Error(parquet?'invalidParquet':'invalidWorkbook'));};parser.postMessage({buffer},[buffer]);});}
function showImportChoices(){const list=$('[data-import-choices]');if(!list)return;list.hidden=!pendingImports.length;list.innerHTML=pendingImports.length?`<h3>${t('selectImportTables')}</h3><p>${t('excelImportHint')}</p>${pendingImports.map((d,i)=>`<label class="loom-import-choice"><input type="checkbox" data-import-choice="${i}" checked><span><strong>${esc(d.name)}</strong><small>${d.rows.length} ${t('rows')} × ${d.columns.length} ${t('columns')}</small><small>${esc(d.columns.slice(0,6).join(' · '))}${d.columns.length>6?' …':''}</small></span></label>`).join('')}<div class="loom-query-actions"><button data-action="import-select-all">${t('selectAllTables')}</button><button data-action="import-select-none">${t('clearAllTables')}</button><button class="primary" data-action="import-selected">${t('importSelected')}</button></div>`:'';}
async function commitImports(added:Dataset[]){
 if(!added.length)throw new Error('noImportSelection');if(datasets.length+added.length>20||[...datasets,...added].reduce((n,d)=>n+new Blob([d.raw]).size,0)>20*1048576)throw new Error('workspaceLimit');
 source().operations=operations;source().cursor=cursor;datasets.push(...added);active=added[0].id;operations=[];cursor=0;ui.filters=[];ui.page=0;ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();pendingImports=[];showImportChoices();showNotice('');await refresh();$<HTMLDialogElement>('[data-import-dialog]')?.close();scheduleSave();
}
async function importFiles(files: File[]) {
 if(!files.length)return;if(importing)throw new Error('importBusy');importing=true;const token=++importGeneration;pendingImports=[];showImportChoices();const added:Dataset[]=[];showNotice('');const status=$('[data-import-progress]');if(status){status.hidden=false;status.textContent=t('importBusy');}
 try{let choose=false;for(const file of files){if(file.size>10*1048576)throw new Error('fileTooLarge');let format=file.name.toLowerCase().split('.').at(-1)!;if(!['csv','tsv','json','xlsx','parquet'].includes(format))throw new Error('unsupported');const buffer=await file.arrayBuffer();if(token!==importGeneration)return;
  if(format==='xlsx'){choose=true;const sheets=await workbookRead(buffer);if(token!==importGeneration)return;added.push(...sheets.map((sheet:any)=>({...sheet,id:crypto.randomUUID(),name:file.name+' / '+sheet.name})));}
  else if(format==='parquet'){const data=await workbookRead(buffer,true);if(token!==importGeneration)return;added.push({id:crypto.randomUUID(),name:file.name,...data});}
  else{if(format==='csv')format=$<HTMLSelectElement>('[data-delimiter]')?.value??'csv';let raw:string;try{raw=new TextDecoder(format==='json'?'utf-8':$<HTMLSelectElement>('[data-encoding]')?.value??'utf-8',{fatal:true}).decode(buffer);}catch{throw new Error('invalidEncoding');}const data=await compute('parse',{raw,format});if(token!==importGeneration)return;added.push({id:crypto.randomUUID(),name:file.name,format,raw,...data});}}
  if(choose){pendingImports=added;showImportChoices();$<HTMLDialogElement>('[data-import-dialog]')?.showModal();}else await commitImports(added);
 }catch(error){if((error as Error).message!=='importCancelled'&&token===importGeneration)throw error;}finally{importing=false;if(status)status.hidden=true;}
}

async function onAction(action: string) {
  if(!ready||busy)return;
  if(action==='search-tools')openToolSearch();
  else if(action==='close-tool-search')$<HTMLDialogElement>('[data-tool-search-dialog]')?.close();
  else if(action==='import'){showNotice('');showImportChoices();$<HTMLDialogElement>('[data-import-dialog]')?.showModal();}
  else if(action==='close-import'){cancelImport();$<HTMLDialogElement>('[data-import-dialog]')?.close();}
  else if(action==='import-select-all'||action==='import-select-none'){root?.querySelectorAll<HTMLInputElement>('[data-import-choice]').forEach(c=>c.checked=action==='import-select-all');}
  else if(action==='import-selected'){if(importing)throw new Error('importBusy');const indices=Array.from(root?.querySelectorAll<HTMLInputElement>('[data-import-choice]:checked')??[],c=>Number(c.dataset.importChoice));await commitImports(indices.map(i=>pendingImports[i]));}
  else if(action==='export-replay'||action==='export-pandas'){const prefix=previewResult&&ui.resultMode!=='before'?pendingOperations(previewOp!):operations.slice(0,viewCursor());if(!previewResult&&ui.filters.length)prefix.push({type:'filter',params:{filters:structuredClone(ui.filters),mode:ui.mode}});const workspace=reproductionWorkspace(datasets,active,prefix);let engine:string;try{const response=await fetch(import.meta.env.BASE_URL+'hw03/replay-engine.js');if(!response.ok)throw Error();engine=await response.text();}catch{throw Error('replayExportFailed');}const options={includeIndex:$<HTMLInputElement>('[data-export-index]')?.checked??false,language:document.documentElement.lang==='en'?'en':'zh'};if(action==='export-pandas')download(pandasBridgeScript(engine,workspace,options),'hw03-analysis.py','text/x-python;charset=utf-8');else download(replayScript(engine,workspace,options),'hw03-analysis.mjs','text/javascript;charset=utf-8');}
  else if(action==='export-json'){const shown=exportData();download(toJSON(shown.rows,shown.columns),'hw03-result.json');}
  else if(action==='load-url'){if(importing)throw new Error('importBusy');const button=$<HTMLButtonElement>('[data-action="load-url"]'),token=++importGeneration;let consuming=false;urlAbort=new AbortController();if(button){button.disabled=true;button.textContent=t('importBusy');}try{const file=await fetchDataFile($<HTMLInputElement>('[data-import-url]')?.value??'',$<HTMLSelectElement>('[data-url-format]')?.value??'csv',fetch,urlAbort.signal);if(token===importGeneration){consuming=true;await importFiles([new File([file.buffer],file.name)]);}}catch(error){if(consuming||token===importGeneration)throw error;}finally{urlAbort=null;if(button){button.disabled=false;button.textContent=t('loadURL');}}}
  else if(action==='export'){const shown=exportData();download(toCSV(shown.rows,shown.columns),'hw03-result.csv','text/csv;charset=utf-8');}
  else if(action==='backup'){const state=snapshot();download(JSON.stringify({...state,datasets:state.datasets.map(({rows,columns,...d})=>d)},null,2),'hw03-workspace.json');}
  else if(action==='restore')$<HTMLInputElement>('[data-backup-file]')?.click();
  else if(action==='retry')await persist();
  else if(action==='toggle-sidebar'){ui.sidebarHidden=!ui.sidebarHidden;scheduleSave();render();}
  else if(action==='cancel-tool')cancelTool();
  else if(action==='apply-tool'){if(previewResult&&previewOp)await perform(previewOp);}
  else if(action==='clear-filters'){ui.filters=[];ui.page=0;invalidatePreview();scheduleSave();render();}
  else if(action==='keep-selected'||action==='exclude-selected'){
    if(ui.filters.length)await perform({type:'filter',params:{filters:structuredClone(ui.filters),mode:ui.mode,exclude:action==='exclude-selected'}});
  }
else if(action==='return-latest'){ui.inspect=null;ui.filters=[];ui.tool='';lastSummary=null;await refresh();scheduleSave();}
  else if(action==='continue-here'){
    const fork=forkHistory(source().branches??[],operations,cursor,viewCursor(),t('branch'),crypto.randomUUID());
    source().branches=fork.branches;operations=fork.operations;cursor=fork.cursor;ui.inspect=null;ui.filters=[];ui.tool='';await refresh();scheduleSave();
  }else if(action==='undo'||action==='redo'){invalidatePreview();ui.tool='';lastSummary=null;ui.inspect=null;cursor=Math.max(0,Math.min(operations.length,cursor+(action==='undo'?-1:1)));ui.filters=[];await refresh();scheduleSave();}
  else if(action==='previous'||action==='next'){const pages=Math.max(1,Math.ceil(visibleRows().length/50));ui.page=Math.max(0,Math.min(pages-1,ui.page+(action==='next'?1:-1)));scheduleSave();render();}
  else if(action==='reset'){if(confirm(t('resetConfirm'))){datasets=defaultDatasets();active=datasets[0].id;operations=[];cursor=0;ui.filters=[];ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();await refresh();scheduleSave();}}
  else if(action==='clear-storage'){if(confirm(t('clearConfirm'))){clearTimeout(saveTimer);await saveQueue;await storage.clear(revision);revision=0;autosave=false;saveStatus='unsaved';datasets=defaultDatasets();active=datasets[0].id;operations=[];cursor=0;ui.filters=[];ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();await refresh();await updateCapacity();}}
  else if(action==='paste'){const raw=$<HTMLTextAreaElement>('[data-paste]')?.value??'';await importFiles([new File([raw],'pasted.csv',{type:'text/csv'})]);}

}
const uiControlMap: Record<string,string> = {'chart-x':'x','scatter-x':'x','scatter-y':'y','chart-category':'category'};
function mount() {
  root=document.querySelector('[data-loom]');if(!root)return;
  root.addEventListener('click',async e=>{
    const target=(e.target as Element).closest<HTMLElement>('button');if(!target||!ready||busy)return;
    try{
      if(target.hasAttribute('data-tool-menu'))toggleToolMenu(target);
      else if(target.dataset.searchTool){ui.section=target.dataset.searchSection!;$<HTMLDialogElement>('[data-tool-search-dialog]')?.close();openTool(target.dataset.searchTool);}
      else if(target.dataset.rightOrder){const param=target.dataset.rightParam!,select=$<HTMLSelectElement>(`[data-control="ext-${param}"]`),chosen=Array.from(select?.selectedOptions??[],o=>o.value),stored=ui.extended?.[ui.tool]?.[param]??[],ordered=[...stored.filter((c:string)=>chosen.includes(c)),...chosen.filter(c=>!stored.includes(c))],i=Number(target.dataset.rightOrderIndex),next=i+(target.dataset.rightOrder==='up'?-1:1);if(next>=0&&next<ordered.length){[ordered[i],ordered[next]]=[ordered[next],ordered[i]];ui.extended[ui.tool][param]=ordered;scheduleSave();render();requestPreview();}}
      else if(target.dataset.indexLevelOrder){const select=$<HTMLSelectElement>('[data-control="ext-levels"]'),chosen=Array.from(select?.selectedOptions??[],o=>o.value),stored=ui.extended?.[ui.tool]?.levels,ordered=Array.isArray(stored)?[...stored.map(String).filter((id:string)=>chosen.includes(id)),...chosen.filter(id=>!stored.map(String).includes(id))]:chosen,i=Number(target.dataset.indexLevelOrderIndex),next=i+(target.dataset.indexLevelOrder==='up'?-1:1);if(next>=0&&next<ordered.length){[ordered[i],ordered[next]]=[ordered[next],ordered[i]];ui.extended??={};ui.extended[ui.tool]??={};ui.extended[ui.tool].levels=ordered;scheduleSave();render();requestPreview();}}
      else if(target.dataset.indexQueryAction){const query=currentIndexQuery(),action=target.dataset.indexQueryAction,i=Number(target.dataset.indexQueryIndex),rows=query.rows;if(action==='add'||action==='duplicate'){if(rows.length>=100000)throw new Error('tooManyRows');const cells=action==='duplicate'?structuredClone(rows[i]):(result.index??rangeIndex(result.rows.length)).names.map(()=>({type:'auto',value:''}));if(action==='duplicate')rows.splice(i+1,0,cells);else rows.push(cells);query.page=Math.floor((action==='duplicate'?i+1:rows.length-1)/10);}else if(action==='remove')rows.splice(i,1);else if(action==='up'||action==='down'){const next=i+(action==='up'?-1:1);if(next>=0&&next<rows.length)[rows[i],rows[next]]=[rows[next],rows[i]];query.page=Math.floor(next/10);}else if(action==='sample'){query.rows=(result.index??rangeIndex(result.rows.length)).values.slice(0,20).map(indexCells);query.page=0;}else if(action==='clear'){query.rows=[];query.page=0;}else if(action==='previous'||action==='next')query.page+=(action==='next'?1:-1);scheduleSave();render();if(!['previous','next'].includes(action))requestPreview();}
      else if(target.hasAttribute('data-named-add')){if(ui.namedSpecs.length<100)ui.namedSpecs.push({column:result.profile.find(p=>p.type==='number')?.column??result.columns[0],method:'mean',name:'metric_'+(ui.namedSpecs.length+1)});scheduleSave();render();requestPreview();}
      else if(target.hasAttribute('data-named-remove')){if(ui.namedSpecs.length>1)ui.namedSpecs.splice(Number(target.dataset.namedRemove),1);scheduleSave();render();requestPreview();}
      else if(target.hasAttribute('data-merge-add')){const right=datasets.find(d=>d.id===ui.merge.dataset),left=result.columns.find(c=>!ui.merge.pairs.some((p:any)=>p.left===c)),r=right?.columns.find(c=>!ui.merge.pairs.some((p:any)=>p.right===c));if(left&&r)ui.merge.pairs.push({left,right:r});scheduleSave();render();requestPreview();}
      else if(target.hasAttribute('data-merge-remove')){if(ui.merge.pairs.length>1)ui.merge.pairs.splice(Number(target.dataset.mergeRemove),1);scheduleSave();render();requestPreview();}
      else if(target.dataset.columnOrder){
        const select=$<HTMLSelectElement>('[data-control="ext-columns"]'),stored=ui.extended?.[ui.tool]?.columns,chosen=Array.from(select?.selectedOptions??[],option=>option.value);
        const ordered=Array.isArray(stored)?[...stored.filter((c:string)=>chosen.includes(c)),...chosen.filter(c=>!stored.includes(c))]:chosen;
        const index=Number(target.dataset.orderIndex),next=index+(target.dataset.columnOrder==='up'?-1:1);
        if(index>=0&&next>=0&&next<ordered.length){[ordered[index],ordered[next]]=[ordered[next],ordered[index]];ui.extended??={};ui.extended[ui.tool]??={};ui.extended[ui.tool].columns=ordered;scheduleSave();render();requestPreview();}
      }else if(target.dataset.multiAction){
        const param=target.dataset.multiParam!,select=$<HTMLSelectElement>(`[data-control="ext-${param}"]`);ui.extended??={};ui.extended[ui.tool]??={};ui.extended[ui.tool][param]=target.dataset.multiAction==='all'?Array.from(select?.options??[],option=>option.value):[];scheduleSave();render();requestPreview();
      }else if(target.dataset.queryAction){
        const path=target.dataset.queryPath??'',node=queryNode(ui.conditionTree,path),action=target.dataset.queryAction;
        if(action==='remove'&&path){const parts=path.split('.'),index=Number(parts.pop()),parent=queryNode(ui.conditionTree,parts.join('.'));parent?.children?.splice(index,1);}
        else if(node?.children&&path.split('.').filter(Boolean).length<8){node.children.push(action==='group'?{mode:'or',children:[newCondition(result.columns[0])]}:newCondition(result.columns[0]));}
        scheduleSave();render();requestPreview();
      }else if(target.dataset.sortAction){
        const action=target.dataset.sortAction,index=Number(target.dataset.sortIndex),keys=ui.sortKeys??[];
        if(action==='add'){const column=result.columns.find(c=>!keys.some((key:any)=>key.column===c));if(column)keys.push({column,desc:false});}
        else if(action==='remove'&&keys.length>1)keys.splice(index,1);
        else if(action==='up'&&index>0)[keys[index-1],keys[index]]=[keys[index],keys[index-1]];
        else if(action==='down'&&index<keys.length-1)[keys[index+1],keys[index]]=[keys[index],keys[index+1]];
        scheduleSave();render();requestPreview();
      }else if(target.dataset.statPair){
        const analysis=shownResult().analysis;if(analysis?.kind!=='correlation')return;
        const [i,j]=target.dataset.statPair.split(',').map(Number),x=analysis.fields[i],y=analysis.fields[j];if(!x||!y)return;
        const token=++pairToken;pairDetail=null;pairPending=true;render();
        try{const detail=await compute('pair',{dataset:source(),operations:previewResult&&ui.resultMode!=='before'?pendingOperations(previewOp!):operations,cursor:analysis.sourceCursor,datasets,x,y});if(token!==pairToken||shownResult().analysis!==analysis)return;pairDetail=detail;}
        catch(error){if(token===pairToken)showNotice((error as Error).message);}
        finally{if(token===pairToken){pairPending=false;render();}}
      }
      else if(target.dataset.action)await onAction(target.dataset.action);
      else if(target.dataset.section){ui.section=target.dataset.section;scheduleSave();render();if(ui.tool&&!readOnlyTool()&&!previewResult)requestPreview(0);}
      else if(target.dataset.tool){target.closest<HTMLElement>('[data-tool-menu-panel]')?.hidePopover();await openTool(target.dataset.tool);if(e.detail===0)$<HTMLElement>('[data-editor] input,[data-editor] select,[data-editor] button')?.focus();}
      else if(target.dataset.viewMode){ui.view=target.dataset.viewMode;ui.page=0;scheduleSave();render();}
      else if(target.dataset.resultMode){resultModeManual=true;ui.resultMode=target.dataset.resultMode;ui.page=0;scheduleSave();render();}
      else if(target.dataset.dataset){
        source().operations=operations;source().cursor=cursor;active=target.dataset.dataset;operations=source().operations??[];cursor=source().cursor??0;ui.filters=[];ui.page=0;ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();await refresh();scheduleSave();
      }else if(target.dataset.field){
        const c=target.dataset.field;
        ui.selectedFields=(e.ctrlKey||e.metaKey)?ui.selectedFields.includes(c)?ui.selectedFields.filter((v:string)=>v!==c):[...ui.selectedFields,c]:[c];
        const p=result.profile.find(p=>p.column===c);
        if(extendedTools[ui.tool]){const control=extendedTools[ui.tool].controls.find(control=>['column','columns','numeric','numerics'].includes(control.kind??''));if(control){ui.extended??={};ui.extended[ui.tool]??={};ui.extended[ui.tool][control.param]=['columns','numerics','optionalColumns'].includes(control.kind??'')?ui.selectedFields:c;}}
        else if(ui.tool==='sort'){ui.sortKeys??=[{column:c,desc:false}];ui.sortKeys[0].column=c;}
        else if(p?.type==='number')ui.x=c;else if(p?.unique<=60)ui.category=c;
        scheduleSave();render();if(ui.tool&&!readOnlyTool())requestPreview();
      }else if(target.dataset.step){invalidatePreview();ui.inspect=Number(target.dataset.step);ui.tool='';ui.filters=[];lastSummary=null;await refresh();scheduleSave();}
      else if(target.dataset.removeFilter){ui.filters.splice(Number(target.dataset.removeFilter),1);ui.page=0;invalidatePreview();scheduleSave();render();}
      else if(target.dataset.sort){const column=target.dataset.sort,previous=ui.sortKeys?.[0];ui.sortKeys=[{column,desc:previous?.column===column?!previous.desc:false}];ui.section='select';await openTool('sort');}
    }catch(error){showNotice((error as Error).message);}
  });
  root.addEventListener('toggle',e=>{const details=e.target as HTMLDetailsElement;if(details.dataset.editorDetails){const tool=details.closest<HTMLElement>('[data-editor-tool]')?.dataset.editorTool;if(!tool)return;ui.editorDetails??={};ui.editorDetails[tool]??={};const key=details.dataset.editorDetails;if(ui.editorDetails[tool][key]!==details.open){ui.editorDetails[tool][key]=details.open;scheduleSave();}return;}if(details.dataset?.panel&&ui.panels[details.dataset.panel]!==details.open){ui.panels[details.dataset.panel]=details.open;scheduleSave();}},true);
  root.addEventListener('input',e=>{
    const target=e.target as HTMLInputElement;
    if(target.matches('[data-tool-search]')){renderToolSearch();return;}
    if(busy)return;
    if(target.dataset.indexQueryKey&&target.tagName!=='SELECT'){const cell=indexQueryCell(target);if(cell){cell[target.dataset.indexQueryKey]=target.value;scheduleSave();requestPreview(450);}return;}
    if(target.dataset.namedParam&&target.tagName!=='SELECT'){ui.namedSpecs[Number(target.dataset.namedIndex)][target.dataset.namedParam]=target.value;scheduleSave();requestPreview(450);return;}
    if(target.dataset.formulaParam&&target.tagName!=='SELECT'){ui.formula[target.dataset.formulaParam]=target.value;scheduleSave();requestPreview(450);return;}
    if(target.dataset.expressionKey&&target.tagName!=='SELECT'){const node=expressionNode(ui.formula.tree,target.dataset.expressionPath??'');if(node){node[target.dataset.expressionKey]=target.value;scheduleSave();requestPreview(450);}return;}
    if(target.dataset.queryKey&&target.tagName!=='SELECT'&&target.type!=='checkbox'){const node=queryNode(ui.conditionTree,target.dataset.queryPath??'');if(node){node[target.dataset.queryKey]=target.value;scheduleSave();requestPreview(450);}return;}
    if(target.dataset.mergeParam&&target.tagName!=='SELECT'){ui.merge??={};ui.merge[target.dataset.mergeParam]=target.value;scheduleSave();requestPreview(450);return;}
    if(target.matches('[data-field-search]')){ui.fieldSearch=target.value;renderFields();scheduleSave();return;}
    if(target.dataset.control?.startsWith('ext-')&&target.tagName!=='SELECT'){if(target.type==='range'&&target.previousElementSibling?.tagName==='OUTPUT')target.previousElementSibling.textContent=target.value;ui.extended??={};ui.extended[ui.tool]??={};ui.extended[ui.tool][target.dataset.control.slice(4)]=target.value;scheduleSave();requestPreview(450);return;}
    if(target.dataset.control&&target.tagName!=='SELECT'){const key=uiControlMap[target.dataset.control];if(key){ui[key]=target.value;scheduleSave();requestPreview(450);}}
  });
  root.addEventListener('change',async e=>{
    if(busy)return;
    const target=e.target as HTMLInputElement;
    try{
      if(target.dataset.indexQueryKey){const cell=indexQueryCell(target);if(cell){cell[target.dataset.indexQueryKey]=target.value;scheduleSave();if(target.tagName==='SELECT')render();requestPreview();}}
      else if(target.dataset.indexQueryOption){const query=currentIndexQuery(),key=target.dataset.indexQueryOption;query[key]=key==='depth'?Number(target.value):target.checked;scheduleSave();render();requestPreview();}
      else if(target.dataset.namedParam){ui.namedSpecs[Number(target.dataset.namedIndex)][target.dataset.namedParam]=target.value;scheduleSave();if(target.tagName==='SELECT')render();requestPreview();}
      else if(target.hasAttribute('data-formula-editor')){ui.formulaEditor=target.value;if(target.value==='fields'&&(ui.formula.tree.kind!=='binary'||!['add','sub','mul','div'].includes(ui.formula.tree.method)||ui.formula.tree.left?.kind!=='column'||ui.formula.tree.right?.kind!=='column'))ui.formula.tree=defaultFormulaTree();scheduleSave();render();requestPreview();}
      else if(target.dataset.formulaParam){ui.formula[target.dataset.formulaParam]=target.value;scheduleSave();if(target.tagName==='SELECT')render();requestPreview();}
      else if(target.dataset.expressionKey){const node=expressionNode(ui.formula.tree,target.dataset.expressionPath??'');if(node){if(target.dataset.expressionKey==='kind'){const numbers=result.profile.filter(p=>p.type==='number').map(p=>p.column),replacement=newExpression(target.value,[...numbers,...result.columns.filter(c=>!numbers.includes(c))]);for(const key of Object.keys(node))delete node[key];Object.assign(node,replacement);}else node[target.dataset.expressionKey]=target.value;scheduleSave();if(target.tagName==='SELECT')render();requestPreview();}}
      else if(target.dataset.mergeParam||target.dataset.mergeSide){ui.merge??={};if(target.dataset.mergeSide)ui.merge.pairs[Number(target.dataset.mergeIndex)][target.dataset.mergeSide]=target.value;else{ui.merge[target.dataset.mergeParam!]=target.value;if(target.dataset.mergeParam==='dataset')delete ui.merge.pairs;}scheduleSave();if(target.tagName==='SELECT')render();requestPreview();}
      else if(target.dataset.queryKey){const node=queryNode(ui.conditionTree,target.dataset.queryPath??'');if(node){node[target.dataset.queryKey]=target.type==='checkbox'?target.checked:target.value;scheduleSave();if(target.tagName==='SELECT')render();requestPreview();}}
      else if(target.dataset.sortParam){const key=ui.sortKeys?.[Number(target.dataset.sortIndex)];if(key){key[target.dataset.sortParam]=target.dataset.sortParam==='desc'?target.value==='descending':target.value;scheduleSave();render();requestPreview();}}
      else if(target.hasAttribute('data-sort-missing')){ui.sortMissing=target.value;scheduleSave();render();requestPreview();}
      else if(target.matches('[data-import-files]')){await importFiles(Array.from(target.files??[]));target.value='';}
      else if(target.matches('[data-backup-file]')){
        const file=target.files?.[0];if(!file)return;if(file.size>50*1048576)throw new Error('fileTooLarge');let parsed;try{parsed=JSON.parse(await file.text());}catch{throw new Error('backupInvalid');}
        const state=validateBackup(parsed);datasets=state.datasets;active=state.active;operations=state.operations;cursor=state.cursor;ui={...ui,...state.ui};ui.inspect=null;ui.tool='';invalidatePreview();lastSummary=null;await refresh();scheduleSave();target.value='';
      }else if(target.matches('[data-autosave]')){autosave=target.checked;if(!autosave){clearTimeout(saveTimer);await saveQueue;}else scheduleSave();updateStatus();}
      else if(target.matches('[data-branch-select]')&&target.value){
        const branch=source().branches?.find(b=>b.id===target.value);if(!branch)return;
        source().branches=preserveBranch(source().branches??[],operations,cursor,t('branch'),crypto.randomUUID()).filter((b:any)=>b.id!==branch.id);
        operations=structuredClone(branch.operations);cursor=branch.cursor;ui.inspect=null;ui.tool='';ui.filters=[];lastSummary=null;invalidatePreview();await refresh();scheduleSave();
      }else if(target.dataset.control?.startsWith('ext-')){
        const select=target as unknown as HTMLSelectElement;ui.extended??={};ui.extended[ui.tool]??={};const param=target.dataset.control.slice(4),previous=ui.extended[ui.tool][param],chosen=select.multiple?Array.from(select.selectedOptions,o=>o.value):[];ui.extended[ui.tool][param]=select.multiple?(['columns','topN','strings','setIndex','indexLoc','reindex'].includes(ui.tool)&&param==='columns'&&Array.isArray(previous)?[...previous.filter((c:string)=>chosen.includes(c)),...chosen.filter(c=>!previous.includes(c))]:chosen):target.value;if(param==='dataset'&&['indexJoin','indexConcat','indexArithmetic','asof'].includes(ui.tool)){delete ui.extended[ui.tool].rightKeys;delete ui.extended[ui.tool].rightColumns;delete ui.extended[ui.tool].rightBy;}if(select.multiple&&param==='levels'&&Array.isArray(previous))ui.extended[ui.tool][param]=[...previous.map(String).filter((id:string)=>chosen.includes(id)),...chosen.filter(id=>!previous.map(String).includes(id))];scheduleSave();if(target.tagName==='SELECT')render();requestPreview();
      }else if(target.dataset.control){
        const key=uiControlMap[target.dataset.control];if(key){ui[key]=target.value;scheduleSave();
          if(['x','y','category'].includes(key)){render();return;}
          if(target.tagName==='SELECT')render();requestPreview();
        }
      }
    }catch(error){showNotice((error as Error).message);}
  });
  root.addEventListener('toggle',e=>{
    const menu=e.target as HTMLElement;if(!menu.matches('[data-tool-menu-panel]'))return;
    const open=menu.matches(':popover-open');$(`[data-tool-menu="${menu.dataset.toolMenuPanel}"]`)?.setAttribute('aria-expanded',String(open));
  },true);
  root.addEventListener('keydown',e=>{
    const target=e.target as HTMLElement,trigger=target.closest<HTMLElement>('[data-tool-menu]');
    if(trigger&&['ArrowDown','ArrowUp'].includes(e.key)){
      e.preventDefault();const menu=$<HTMLElement>(`[data-tool-menu-panel="${trigger.dataset.toolMenu}"]`)!;
      if(!menu.matches(':popover-open'))toggleToolMenu(trigger);
      const buttons=menu.querySelectorAll<HTMLButtonElement>('[data-tool]:not(:disabled)');(e.key==='ArrowUp'?buttons[buttons.length-1]:buttons[0])?.focus();
    }
    const menu=target.closest<HTMLElement>('[data-tool-menu-panel]');
    if(menu&&['ArrowDown','ArrowUp','Home','End','Escape'].includes(e.key)){
      e.preventDefault();const buttons=Array.from(menu.querySelectorAll<HTMLButtonElement>('[data-tool]:not(:disabled)')),index=buttons.indexOf(target as HTMLButtonElement);
      if(e.key==='Escape'){menu.hidePopover();$<HTMLElement>(`[data-tool-menu="${menu.dataset.toolMenuPanel}"]`)?.focus();}
      else buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length]?.focus();
    }
  });
  root.addEventListener('keydown',e=>{const dialog=$<HTMLDialogElement>('[data-tool-search-dialog]');if(!dialog?.open)return;if(e.key==='Escape'){e.preventDefault();dialog.close();return;}const target=e.target as HTMLElement,buttons=Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-search-tool]:not(:disabled)')),i=buttons.indexOf(target as HTMLButtonElement);if(e.key==='ArrowDown'){e.preventDefault();buttons[Math.min(buttons.length-1,i+1)]?.focus();}else if(e.key==='ArrowUp'){e.preventDefault();if(i<=0)$<HTMLInputElement>('[data-tool-search]')?.focus();else buttons[i-1].focus();}else if(e.key==='Enter'&&target.matches('[data-tool-search]')){e.preventDefault();buttons[0]?.click();}});
  root.addEventListener('close',e=>{if((e.target as Element).matches('[data-tool-search-dialog]'))$<HTMLButtonElement>('[data-action="search-tools"]')?.focus();},true);
  root.addEventListener('cancel',e=>{if((e.target as Element).matches('[data-import-dialog]'))cancelImport();},true);
  root.addEventListener('dragover',e=>{if((e.target as Element).closest('[data-drop]'))e.preventDefault();});
  root.addEventListener('drop',e=>{if((e.target as Element).closest('[data-drop]')){e.preventDefault();void importFiles(Array.from(e.dataTransfer?.files??[])).catch(error=>showNotice(error.message));}});
  if(ready){render();void updateCapacity();if(ui.tool&&!readOnlyTool()&&!previewResult)requestPreview(0);}
}
async function initialize() {
  try{
    const saved=await storage.load();
    if(saved){const restored=validateBackup(saved);datasets=restored.datasets;active=restored.active;operations=restored.operations;cursor=restored.cursor;revision=saved.revision??0;ui={...ui,...restored.ui};saveStatus='restored';}
    else saveStatus='unsaved';
  }catch(error){autosave=false;showNotice((error as Error).message);}
  if(ui.tool){const section=Object.entries(sectionTools).find(([,groups])=>groups.some(group=>group.tools.includes(ui.tool)))?.[0];if(section)ui.section=section;}
  ready=true;await refresh();if(ui.tool&&!readOnlyTool()&&!inspecting())requestPreview(0);if(autosave&&revision===0)scheduleSave();void updateCapacity();
}
mount();void initialize();
document.addEventListener('astro:after-swap',mount);
let resizeTimer:ReturnType<typeof setTimeout>;window.addEventListener('resize',()=>{root?.querySelectorAll<HTMLElement>('[data-tool-menu-panel]:popover-open').forEach(menu=>menu.hidePopover());clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(syncDefaultResultMode())render();else drawCharts();},120);});

document.addEventListener('keydown',e=>{if(root?.isConnected&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openToolSearch();}});
