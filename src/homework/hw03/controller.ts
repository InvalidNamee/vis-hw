import * as d3 from 'd3';
import { t, type Key } from './copy';
import { defaultDatasets, matches, isMissing, isNumber, toCSV, validateBackup } from './model.mjs';
import * as storage from './storage';
import { preserveBranch, forkHistory } from './history.mjs';
import AnalysisWorker from './worker?worker';

type Row = Record<string, any>;
type Dataset = { id: string; name: string; format: string; raw: string; rows: Row[]; columns: string[]; operations?: Operation[]; cursor?: number; branches?: any[] };
type Operation = { type: string; params: any };
type Filter = { column: string; operator: string; value?: any; upper?: any };
type Result = { rows: Row[]; columns: string[]; profile: any[]; steps: { before: number; after: number }[] };
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
let previewOp: Operation | null = null, previewToken = 0, previewTimer: ReturnType<typeof setTimeout>, lastSummary: any = null;
let ui: any = { section: 'select', view: 'overview', tool: '', resultMode: 'after', inspect: null, panels: {datasets:true, fields:true, timeline:true, storage:false}, selectedFields: [], tab: 'overview', x: 'sales', y: 'cost', category: 'region', filters: [], mode: 'and', page: 0 };
const source = () => datasets.find(d => d.id === active)!;
const $ = <T extends Element = HTMLElement>(selector: string) => root?.querySelector<T>(selector) ?? null;
const esc = (value: any) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const label = (value: any) => isMissing(value) ? '∅' : String(value);
const number = (value: any) => isMissing(value) ? '—' : new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-US' : 'zh-CN', { maximumFractionDigits: 2 }).format(value);
const fieldOptions = (columns: string[], current?: string) => columns.map(c => `<option value="${esc(c)}" ${c === current ? 'selected' : ''}>${esc(c)}</option>`).join('');
const keyOptions = (keys: Key[], current?: string) => keys.map(k => `<option value="${k}" ${k === current ? 'selected' : ''}>${t(k)}</option>`).join('');
const field = (title: Key, name: string, options: string) => `<label>${t(title)}<select data-control="${name}">${options}</select></label>`;
const input = (title: Key, name: string, value = '', type = 'text') => `<label>${t(title)}<input data-control="${name}" type="${type}" value="${esc(value)}"/></label>`;
const value = (name: string) => $<HTMLInputElement | HTMLSelectElement>(`[data-control="${name}"]`)?.value ?? '';
const button = (action: string, key: Key, primary = false) => `<button data-action="${action}" ${primary ? 'class="primary"' : ''}>${t(key)}</button>`;
const selectedRows = (data: Result = result) => data.rows.filter(r => ui.filters.length === 0 || (ui.mode === 'or' ? ui.filters.some((f: Filter) => matches(r, f)) : ui.filters.every((f: Filter) => matches(r, f))));
function showNotice(key: string) { notice = key; for (const selector of ['[data-notice]', '[data-import-notice]']) { const element = $(selector); if (element) { element.hidden = !notice; element.textContent = notice ? t((notice in errorKeys ? notice : 'invalidOperation') as Key) : ''; } } }
const errorKeys: Record<string, boolean> = Object.fromEntries(['storageConflict','storageQuota','storageFailed','storageCorrupt','storageBlocked','emptyFile','csvInvalid','rowWidth','duplicateColumns','jsonInvalid','nestedJson','invalidNumber','noValues','missingColumn','missingDataset','invalidOperation','tooManyCategories','tooManyRows','fileTooLarge','unsupported','backupInvalid','invalidDate','workspaceLimit'].map(k => [k,true]));
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
async function refresh() {
  const token=++refreshToken;
  const computed = await compute('replay', { dataset: source(), operations, cursor: viewCursor(), datasets }); if(token!==refreshToken)return; result = computed; previewResult = null; normalizeFields(); render();
}
function normalizeFields() {
  if (!['overview','data'].includes(ui.view)) ui.view = ui.tab === 'data' ? 'data' : 'overview';
  if (!['select','clean','transform','group','join','time','visual'].includes(ui.section)) ui.section = 'select';
  if (!['','filter','sort','fill','dropMissing','dedup','calculate','group','pivot','month','join','quality','summary','explore'].includes(ui.tool)) ui.tool = '';
  if (!Number.isInteger(ui.inspect) || ui.inspect < 0 || ui.inspect > operations.length) ui.inspect = null;
  ui.selectedFields = Array.isArray(ui.selectedFields) ? ui.selectedFields.filter((c:string)=>result.columns.includes(c)) : [];
  ui.panels = {datasets:true,fields:true,timeline:true,storage:false,...ui.panels};
  ui.mode = ui.mode === 'or' ? 'or' : 'and';
  ui.page = Number.isInteger(ui.page) && ui.page >= 0 ? ui.page : 0;
  ui.filters = Array.isArray(ui.filters) ? ui.filters.filter((f: any) => f && typeof f.column === 'string' && ['eq','contains','gte','lte','range','missing','present'].includes(f.operator)) : [];
  const numeric = result.profile.filter(p => p.type === 'number').map(p => p.column);
  if (!numeric.includes(ui.x)) ui.x = numeric[0] ?? '';
  if (!numeric.includes(ui.y)) ui.y = numeric.find((c: string) => c !== ui.x) ?? numeric[0] ?? '';
  const categories = result.profile.filter(p => p.type !== 'number' && p.unique <= 60 && p.unique > 0).map(p => p.column);
  if (!categories.includes(ui.category)) ui.category = categories[0] ?? '';
  ui.filters = ui.filters.filter((f: Filter) => result.columns.includes(f.column));
}
function table(rows: Row[], columns: string[], sort = false, limit = 50) {
  if (!rows.length) return `<div class="loom-empty">${t('noRows')}</div>`;
  return `<div class="loom-table-wrap"><table><thead><tr>${columns.map(c => `<th>${sort ? `<button data-sort="${esc(c)}">${esc(c)}${operations[cursor - 1]?.type === 'sort' && operations[cursor - 1].params.column === c ? operations[cursor - 1].params.desc ? ' ↓' : ' ↑' : ''}</button>` : esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, limit).map(r => `<tr>${columns.map(c => `<td class="${isMissing(r[c]) ? 'null' : isNumber(r[c]) ? 'numeric' : ''}" title="${esc(label(r[c]))}">${isMissing(r[c]) ? '∅' : isNumber(r[c]) ? number(r[c]) : esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const sectionTools: Record<string, {label: Key; tools: string[]}[]> = {
  select: [{label:'selectTools',tools:['filter']},{label:'sortTools',tools:['sort']}],
  clean: [{label:'missingTools',tools:['fill','dropMissing']},{label:'duplicateTools',tools:['dedup']},{label:'analysisTools',tools:['quality']}],
  transform: [{label:'calculate',tools:['calculate']}], group: [{label:'analysisTools',tools:['group','pivot']}],
  join: [{label:'joinTitle',tools:['join']}], time: [{label:'analysisTools',tools:['month']}],
  visual: [{label:'chartsTools',tools:['explore','quality','summary']}],
};
const toolKey = (tool:string):Key => ({filter:'filter',sort:'sort',fill:'fill',dropMissing:'dropMissing',dedup:'dedup',calculate:'calculate',group:'groupSimple',pivot:'pivot',month:'month',join:'joinTitle',quality:'quality',summary:'summaryTool',explore:'overviewTool'} as Record<string,Key>)[tool]??'overview';
const analyticalTool = () => ['group','pivot','month','join'].includes(ui.tool);
const readOnlyTool = () => ['quality','summary','explore'].includes(ui.tool);
function summaryHTML() {
  const data=previewResult, summary=data ? {op:previewOp,before:result,after:data} : lastSummary;
  if(!summary) {
    const op=operations[cursor-1],step=result.steps[cursor-1];
    return op&&step?`<div class="loom-operation-summary applied"><span class="loom-summary-state">${t('applied')} · ${operationLabel(op)}</span><span>${esc(operationDetail(op))}</span><span>${t('rowsChanged')} <strong>${number(step.before)} → ${number(step.after)}</strong></span></div>`:'';
  }
  const before=summary.before,after=summary.after,missing=(d:Result)=>d.profile.reduce((n:number,p:any)=>n+p.missing,0);
  let extra='';
  if(summary.op?.type==='join'){
    const p=summary.op.params,right=datasets.find(d=>d.id===p.dataset),keys=new Set(right?.rows.map(r=>JSON.stringify(r[p.rightKey])));
    const inputRows=selectedRows(before),matched=inputRows.filter(r=>keys.has(JSON.stringify(r[p.leftKey]))).length;
    extra=`<span>${t('matchesCount')} <strong>${number(matched)}</strong></span><span>${t('unmatchedCount')} <strong>${number(inputRows.length-matched)}</strong></span>`;
  }
  return `<div class="loom-operation-summary ${data?'preview':'applied'}"><span class="loom-summary-state">${t(data?'previewReady':'applied')} · ${summary.op ? operationLabel(summary.op):t('filter')}</span><span>${t('rowsChanged')} <strong>${number(before.rows.length)} → ${number(after.rows.length)}</strong></span><span>${t('columnsChanged')} <strong>${before.columns.length} → ${after.columns.length}</strong></span><span>${t('missingChanged')} <strong>${number(missing(before))} → ${number(missing(after))}</strong></span>${extra}</div>`;
}
function toolForm() {
  const columns=result.columns,numeric=result.profile.filter(p=>p.type==='number').map(p=>p.column), dates=result.profile.filter(p=>p.type==='date').map(p=>p.column);
  if(!ui.tool||readOnlyTool()||inspecting())return '';
  let content='';
  if(ui.tool==='filter')content=field('column','filter-column',fieldOptions(columns,ui.filterColumn))+field('operator','filter-operator',keyOptions(['eq','contains','gte','lte','missingOp','present'],ui.filterOperator))+input('value','filter-value',ui.filterValue??'')+field('condition','filter-mode',keyOptions(['and','or'],ui.mode))+button('add-filter','addFilter');
  if(ui.tool==='sort')content=field('column','sort-column',fieldOptions(columns,ui.sortColumn))+field('sort','sort-direction',keyOptions(['ascending','descending'],ui.sortDirection));
  if(['fill','dropMissing'].includes(ui.tool))content=field('column','clean-column',fieldOptions(columns,ui.cleanColumn??(columns.includes('cost')?'cost':numeric[0]??columns[0])))+(ui.tool==='fill'?field('method','fill-method',keyOptions(['mean','median','constant'],ui.fillMethod))+(ui.fillMethod==='constant'?input('value','fill-value',ui.fillValue??'0'):''):'');
  if(ui.tool==='dedup')content=`<p>${t('dedup')}</p>`;
  if(ui.tool==='calculate')content=input('newColumn','calc-name',ui.calcName??'profit')+field('leftField','calc-left',fieldOptions(numeric,ui.calcLeft??(numeric.includes('sales')?'sales':ui.x)))+field('arithmetic','calc-operator',['-','+','*','/'].map(s=>`<option value="${s}" ${s===ui.calcOperator?'selected':''}>${s}</option>`).join(''))+field('rightField','calc-right',fieldOptions(numeric,ui.calcRight??(numeric.includes('cost')?'cost':ui.y)));
  if(['group','pivot','month'].includes(ui.tool))content=field('group','group-column',fieldOptions(ui.tool==='month'?dates:columns,ui.groupColumn??(ui.tool==='month'?dates[0]:ui.category)))+field('metric','group-value',fieldOptions(numeric.length?numeric:columns,ui.groupValue??ui.x))+field('aggregate','group-method',keyOptions(['sum','mean','median','count','nunique','min','max','std'],ui.groupMethod))+(ui.tool==='pivot'?field('pivotColumn','pivot-column',fieldOptions(columns,ui.pivotColumn??'category')):'');
  if(ui.tool==='join'){
    const right=datasets.find(d=>d.id===ui.joinDataset&&d.id!==active)??datasets.find(d=>d.id!==active);
    content=field('rightTable','join-dataset',datasets.filter(d=>d.id!==active).map(d=>`<option value="${esc(d.id)}" ${d.id===right?.id?'selected':''}>${esc(d.name)}</option>`).join(''))+field('leftKey','join-left',fieldOptions(columns,ui.joinLeft??'product_id'))+field('rightKey','join-right',fieldOptions(right?.columns??[],ui.joinRight??'product_id'))+field('how','join-how',keyOptions(['left','inner'],ui.joinHow))+`<p>${t('joinHint')}</p>`;
  }
  return `<section class="loom-editor"><div class="loom-editor-heading"><strong>${t('currentTool')}: ${t(toolKey(ui.tool))}</strong>${button('cancel-tool','cancel')}</div><div class="loom-tool-form">${content}</div><div class="loom-editor-footer"><span data-preview-status role="status"></span>${button('preview-tool','preview')}${button('apply-tool','apply',true)}</div></section>`;
}
function overviewHTML(data:Result) {
  const numeric=data.profile.filter(p=>p.type==='number').map(p=>p.column),cats=data.profile.filter(p=>p.type!=='number'&&p.unique<=60&&p.unique>0).map(p=>p.column);
  return `<p class="loom-chart-note">${t(previewResult?'chartLocked':'chartHint')}</p><div class="loom-chart-grid"><section class="loom-card"><div class="loom-card-heading"><h2>${t('distribution')}</h2><select data-control="chart-x" aria-label="${t('x')}">${fieldOptions(numeric,ui.x)}</select></div><div class="loom-chart" data-chart="histogram"></div></section><section class="loom-card"><div class="loom-card-heading"><h2>${t('categories')}</h2><select data-control="chart-category" aria-label="${t('category')}">${fieldOptions(cats,ui.category)}</select></div><div class="loom-chart" data-chart="category"></div></section><section class="loom-card wide"><div class="loom-card-heading"><h2>${t('relationship')}</h2><div>${field('x','scatter-x',fieldOptions(numeric,ui.x))}${field('y','scatter-y',fieldOptions(numeric,ui.y))}</div></div><div class="loom-chart" data-chart="scatter"></div><p class="loom-help">${t('samplePoints')}</p></section></div>`;
}
function qualityHTML(data:Result){return `<section class="loom-card"><h2>${t('qualityTitle')}</h2><p class="loom-help">${t('qualityHint')}</p><div class="loom-quality-rates">${data.profile.map(p=>`<div class="loom-field-stat"><div><span>${esc(p.column)}</span><span>${number(p.missing)} / ${number(data.rows.length)}</span></div><div class="loom-progress"><span style="width:${data.rows.length?p.missing/data.rows.length*100:0}%"></span></div></div>`).join('')}</div><h3>${t('qualityMap')}</h3><p class="loom-help">${t('qualityMapHint')}</p><div class="loom-quality" data-chart="quality"></div></section>`;}
function statsHTML(data:Result){return `<section class="loom-card"><h2>${t('summary')}</h2><div class="loom-table-wrap"><table><thead><tr>${['column','unique','missing','min','max','mean','median'].map(k=>`<th>${t(k as Key)}</th>`).join('')}</tr></thead><tbody>${data.profile.map((p:any)=>`<tr><td>${esc(p.column)}</td><td class="numeric">${number(p.unique)}</td><td class="numeric">${number(p.missing)}</td>${['min','max','mean','median'].map(k=>`<td class="numeric">${number(p[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;}
function render() {
  if(!root||!ready)return;
  root.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(control=>control.disabled=false);
  const focused=root.contains(document.activeElement)?document.activeElement as HTMLInputElement:null;
  const focusName=focused?.dataset.control;
  const caret=focused?.tagName==='INPUT'&&focused.type==='text'?focused.selectionStart:null;
  const shown=shownResult(), rows=shown===result?selectedRows():shown.rows;
  $('[data-current-source]')!.textContent=source().name;
  $('[data-datasets]')!.innerHTML=datasets.map(d=>`<button class="loom-dataset ${d.id===active?'active':''}" data-dataset="${esc(d.id)}">${esc(d.name)}</button>`).join('');
  $('[data-dataset-count]')!.textContent=String(datasets.length);
  renderFields();
  $('[data-column-count]')!.textContent=String(result.columns.length);
  $('[data-step-count]')!.textContent=String(operations.length+1);
  $('[data-source]')!.textContent=source().id.startsWith('demo-')?t('sample'):source().name;
  const sectionKeys:Record<string,Key>={select:'selectSection',clean:'cleanSection',transform:'transformSection',group:'groupSection',join:'joinSection',time:'timeSection',visual:'visualSection'};
  $('[data-sections]')!.innerHTML=Object.entries(sectionKeys).map(([id,key])=>`<button data-section="${id}" class="${ui.section===id?'active':''}" aria-pressed="${ui.section===id}">${t(key)}</button>`).join('');
  $('[data-tools]')!.innerHTML=sectionTools[ui.section].map(g=>`<div class="loom-tool-group"><span>${t(g.label)}</span><div>${g.tools.map(tool=>`<button data-tool="${tool}" ${inspecting()?'disabled':''} class="${ui.tool===tool?'active':''}">${t(toolKey(tool))}</button>`).join('')}</div></div>`).join('');
  root.classList.toggle('sidebar-hidden',!!ui.sidebarHidden);
  root.classList.toggle('has-side-editor',analyticalTool()&&!inspecting());
  for(const panel of root.querySelectorAll<HTMLDetailsElement>('[data-panel]'))panel.open=ui.panels[panel.dataset.panel!]??false;
  $('[data-editor]')!.innerHTML=toolForm();
  $('[data-operation-summary]')!.innerHTML=inspecting()?'':summaryHTML();
  const missing=shown.profile.reduce((n,p)=>n+p.missing,0);
  $('[data-metrics]')!.innerHTML=`<span><strong>${number(shown.rows.length)}</strong> ${t('rows')}</span><span><strong>${shown.columns.length}</strong> ${t('columns')}</span><span><strong>${number(missing)}</strong> ${t('missing')}</span>`;
  $('[data-result-modes]')!.innerHTML=previewResult?['before','after','compare'].map(mode=>`<button data-result-mode="${mode}" class="${ui.resultMode===mode?'active':''}">${t(mode==='compare'?'compare':mode==='before'?'resultBefore':'resultAfter')}</button>`).join(''):'';
  root.querySelectorAll<HTMLButtonElement>('[data-view-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.viewMode===ui.view);b.setAttribute('aria-pressed',String(b.dataset.viewMode===ui.view));});
  $('[data-history-notice]')!.innerHTML=inspecting()?`<div class="loom-history-notice"><div><strong>${t('viewingHistory')} ${viewCursor()+1} / ${operations.length+1}</strong><p>${t('historyReadOnly')}</p></div><div>${button('return-latest','returnLatest')}${button('continue-here','continueHere',true)}</div></div>`:'';
  $('[data-selection]')!.innerHTML=ui.filters.length&&!previewResult&&!inspecting()?`<span>${t('temporarySelection')} <strong>${number(rows.length)}</strong> / ${number(result.rows.length)}</span>${ui.filters.map((f:Filter,i:number)=>`<button class="loom-chip" data-remove-filter="${i}">${esc(f.column)} ${t(f.operator==='missing'?'missingOp':f.operator as Key)} ${esc(f.value??'')}${f.upper!==undefined?'–'+number(f.upper):''} ×</button>`).join('')}${button('keep-selected','keepSelected',true)}${button('exclude-selected','excludeSelected')}${button('clear-filters','clearFilters')}`:'';
  let html='';
  if(previewResult&&ui.resultMode==='compare'){
    html=`<div class="loom-comparison">${[result,previewResult].map((d,i)=>`<section class="loom-card"><h2>${t(i?'resultAfter':'resultBefore')}</h2><div class="loom-diff-stats"><strong>${number(d.rows.length)}</strong> ${t('rows')} <strong>${number(d.profile.reduce((n,p)=>n+p.missing,0))}</strong> ${t('missing')}</div>${ui.view==='data'?table(d.rows,d.columns,false,12):`<div class="loom-chart" data-chart="compare-${i}"></div>`}</section>`).join('')}</div>`;
  }else if(ui.view==='data'){
    const pages=Math.max(1,Math.ceil(rows.length/50));ui.page=Math.min(ui.page,pages-1);
    html=`<p class="loom-help">${t('sortHint')}</p>${table(rows.slice(ui.page*50),shown.columns,!inspecting()&&!previewResult)}<div class="loom-pagination">${button('previous','previous')}<span>${ui.page+1} / ${pages}</span>${button('next','next')}</div>`;
  }else if(ui.tool==='quality'||['fill','dropMissing','dedup'].includes(ui.tool))html=qualityHTML(shown);
  else if(ui.tool==='summary')html=statsHTML(shown);
  else if(['group','pivot','month'].includes(ui.tool)&&previewResult&&ui.resultMode!=='before'||!ui.tool&&['group','pivot'].includes(operations[viewCursor()-1]?.type))html='<div data-analysis-output></div>';
  else html=overviewHTML(shown);
  $('[data-view]')!.innerHTML=html;
  const selectedStep=viewCursor();
  $('[data-history]')!.innerHTML=`<button data-step="0" class="loom-step ${selectedStep===0?'active':''}"><span>1</span><div><strong>${t('original')}</strong><small>${number(source().rows.length)} ${t('rows')}</small></div></button>`+operations.map((op,i)=>`<div class="loom-step-wrap"><button data-step="${i+1}" class="loom-step ${selectedStep===i+1?'active':''} ${i>=cursor?'future':''}"><span>${i+2}</span><div><strong>${operationLabel(op)}</strong><small>${esc(operationDetail(op))}</small></div>${i+1===cursor?'<i></i>':''}</button><details class="loom-step-detail"><summary>${t('details')}</summary><p>${esc(operationDetail(op))}</p>${result.steps[i]?`<p>${number(result.steps[i].before)} → ${number(result.steps[i].after)} ${t('rows')}</p>`:''}</details></div>`).join('');
  const branches=source().branches??[];
  $('[data-branches]')!.innerHTML=branches.length?`<label class="loom-branch-select">${t('branches')}<select data-branch-select><option value="">${t('restoreBranch')}</option>${branches.map((b,i)=>`<option value="${esc(b.id)}">${t('branch')} ${i+1} · ${b.cursor+1} ${t('history')}</option>`).join('')}</select></label>`:'';
  $<HTMLButtonElement>('[data-action="undo"]')!.disabled=cursor===0||inspecting();$<HTMLButtonElement>('[data-action="redo"]')!.disabled=cursor===operations.length||inspecting();
  const toggle=$<HTMLButtonElement>('[data-action="toggle-sidebar"]')!;toggle.textContent=t(ui.sidebarHidden?'expandSidebar':'collapseSidebar');toggle.setAttribute('aria-expanded',String(!ui.sidebarHidden));
  const search=$<HTMLInputElement>('[data-field-search]');if(search)search.value=ui.fieldSearch??'';
  root.querySelectorAll('input,select,textarea').forEach(c=>c.setAttribute('data-loom-control',''));
  if(busy)root.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(control=>control.disabled=true);
  root.setAttribute('aria-busy',String(busy));showNotice(notice);updateStatus();updatePreviewStatus();
  if(focusName){const next=$<HTMLInputElement>(`[data-control="${focusName}"]`);next?.focus({preventScroll:true});if(caret!==null&&next?.tagName==='INPUT'&&next.type==='text')next.setSelectionRange(caret,caret);}
  requestAnimationFrame(drawCharts);
}
function renderFields(){
  if(!root)return;const query=String(ui.fieldSearch??'').toLowerCase();
  $('[data-fields]')!.innerHTML=result.profile.filter(p=>p.column.toLowerCase().includes(query)).map(p=>`<button class="loom-field ${ui.selectedFields.includes(p.column)?'active':''}" data-field="${esc(p.column)}" aria-pressed="${ui.selectedFields.includes(p.column)}" title="${t(p.type)}"><span class="loom-type ${p.type}">${p.type==='number'?'#':p.type==='date'?'◷':'Aa'}</span><span>${esc(p.column)}</span></button>`).join('');
}
function operationDetail(op:Operation){const p=op.params;return op.type==='filter'?p.filters.map((f:Filter)=>`${f.column} ${t(f.operator==='missing'?'missingOp':f.operator as Key)} ${f.value??''}`).join(', '):op.type==='calculate'?`${p.name} = ${p.left} ${p.operator} ${p.right}`:op.type==='join'?`${p.leftKey} / ${p.rightKey} · ${t(p.how)}`:op.type==='group'||op.type==='pivot'?`${p.group} / ${p.value} · ${t(p.method)}`:op.type==='fill'?`${p.column} · ${t(p.method)}`:p.column??t('dedup');}
function operationLabel(op: Operation) {
  const key = ({filter:'filter',sort:'sort',dedup:'dedup',fill:'fill',dropMissing:'dropMissing',group:'groupSimple',pivot:'pivot',join:'joinTitle',calculate:'calculate'} as Record<string,Key>)[op.type]??'apply';
  return esc(t(key));
}
function chart(selector: string) {
  const element = $<HTMLElement>(selector); if (!element) return null;
  element.replaceChildren();
  const width = Math.max(200,element.clientWidth), height=element.clientHeight||220;
  return { element, svg: d3.select(element).append('svg').attr('viewBox',`0 0 ${width} ${height}`), width, height, m:{left:44,right:14,top:12,bottom:30} };
}
function addChartFilter(f: Filter) { if(busy||previewResult||inspecting())return; ui.filters = [...ui.filters.filter((existing: Filter)=>existing.column!==f.column),f]; ui.page=0; invalidatePreview(); scheduleSave(); render(); }
function drawCharts() {
  if(!root||!ready)return;
  const result=shownResult(),selected=selectedRows(result),selectedSet=new Set(selected);
  const hist=chart('[data-chart="histogram"]');
  if(hist) {
    const data=result.rows.map(r=>r[ui.x]).filter(isNumber) as number[];
    if(!data.length)hist.element.innerHTML=`<p class="loom-empty">${t('noNumeric')}</p>`;
    else {
      let [lo,hi]=d3.extent(data) as [number,number]; if(lo===hi){lo-=.5;hi+=.5;}
      const x=d3.scaleLinear().domain([lo,hi]).nice().range([hist.m.left,hist.width-hist.m.right]);
      const bins=d3.bin().domain(x.domain() as [number,number]).thresholds(x.ticks(14))(data);
      const y=d3.scaleLinear().domain([0,d3.max(bins,b=>b.length)||1]).nice().range([hist.height-hist.m.bottom,hist.m.top]);
      hist.svg.append('g').attr('transform',`translate(0,${hist.height-hist.m.bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('~s')));
      hist.svg.append('g').attr('transform',`translate(${hist.m.left},0)`).call(d3.axisLeft(y).ticks(4));
      hist.svg.selectAll('rect').data(bins).join('rect').attr('class','bar').attr('x',b=>x(b.x0!)+1).attr('y',b=>y(b.length)).attr('width',b=>Math.max(1,x(b.x1!)-x(b.x0!)-2)).attr('height',b=>y(0)-y(b.length)).attr('opacity',b=>ui.filters.length && !selected.some(r=>isNumber(r[ui.x])&&r[ui.x]>=b.x0!&&r[ui.x]<=b.x1!)?.25:1).attr('tabindex',0).attr('role','button').attr('aria-label',b=>`${number(b.x0)}–${number(b.x1)}: ${b.length}`).on('click',(_,b)=>addChartFilter({column:ui.x,operator:'range',value:b.x0,upper:b.x1})).on('keydown',(e,b)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();addChartFilter({column:ui.x,operator:'range',value:b.x0,upper:b.x1});}}).append('title').text(b=>`${number(b.x0)}–${number(b.x1)} · ${b.length}`);
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
  if(quality){quality.replaceChildren();const cols=result.columns.slice(0,30),rows=result.rows.slice(0,100),w=Math.max(240,quality.clientWidth),cw=(w-60)/Math.max(1,cols.length);const svg=d3.select(quality).append('svg').attr('viewBox',`0 0 ${w} 160`);cols.forEach((c,i)=>{svg.append('text').attr('x',60+i*cw).attr('y',12).text(c.slice(0,9));rows.forEach((r,j)=>svg.append('rect').attr('x',60+i*cw).attr('y',22+j*1.3).attr('width',Math.max(1,cw-2)).attr('height',1.1).attr('fill',isMissing(r[c])?'#c88b3a':'#5b8be130').append('title').text(`${j+1} · ${c}: ${label(r[c])}`));});svg.append('text').attr('x',0).attr('y',30).text('1');svg.append('text').attr('x',0).attr('y',150).text(String(rows.length));}
  if($('[data-analysis-output]'))drawAnalysis(result);
  if(previewResult&&ui.resultMode==='compare')drawComparison();
}
function drawAnalysis(data: Result) {
  const output=$('[data-analysis-output]');if(!output)return;
  if(data.columns.length>2){
    const nums=data.rows.flatMap(r=>data.columns.slice(1).map(c=>r[c])).filter(isNumber),max=nums.reduce((m,v)=>Math.max(m,Math.abs(v)),1);
    output.innerHTML=`<div class="loom-table-wrap loom-heat"><table><thead><tr>${data.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${data.rows.slice(0,60).map(r=>`<tr>${data.columns.map((c,i)=>`<td style="--intensity:${i&&isNumber(r[c])?Math.abs(r[c])/max:0}">${isNumber(r[c])?number(r[c]):esc(label(r[c]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }else{
    output.innerHTML='<div class="loom-chart" data-chart="group"></div>'+table(data.rows,data.columns);
    const g=chart('[data-chart="group"]');if(!g)return;
    const [key,metric]=data.columns,rows=data.rows.slice(0,15),x=d3.scaleBand<string>().domain(rows.map(r=>label(r[key]))).range([g.m.left,g.width-g.m.right]).padding(.35),values=rows.map(r=>r[metric]).filter(isNumber),y=d3.scaleLinear().domain([Math.min(0,...values),Math.max(1,...values)]).nice().range([g.height-g.m.bottom,g.m.top]);
    g.svg.append('g').attr('transform',`translate(0,${g.height-g.m.bottom})`).call(d3.axisBottom(x).tickFormat(v=>v.length>10?v.slice(0,9)+'…':v));g.svg.append('g').attr('transform',`translate(${g.m.left},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('~s')));
    g.svg.selectAll('rect').data(rows).join('rect').attr('class','bar').attr('x',r=>x(label(r[key]))!).attr('y',r=>y(Math.max(0,r[metric]??0))).attr('width',x.bandwidth()).attr('height',r=>Math.abs(y(r[metric]??0)-y(0))).append('title').text(r=>`${label(r[key])}: ${number(r[metric])}`);
  }
}
function drawComparison(){
  if(!previewResult)return;
  [result,previewResult].forEach((data,i)=>{
    const c=chart(`[data-chart="compare-${i}"]`);if(!c)return;
    const names=data.columns.filter(k=>data.profile.find(p=>p.column===k)?.type==='number');
    const preferred=previewOp?.params.column??ui.x;
    const field=names.includes(preferred)?preferred:names.includes(ui.x)?ui.x:names[0];
    if(!field){c.element.innerHTML=table(data.rows,data.columns,false,8);return;}
    const all=[...result.rows,...previewResult!.rows].map(r=>r[field]).filter(isNumber) as number[];
    let domain=d3.extent(all) as [number,number];if(domain[0]===domain[1])domain=[domain[0]-.5,domain[1]+.5];
    const x=d3.scaleLinear().domain(domain).nice().range([c.m.left,c.width-c.m.right]);const bins=d3.bin().domain(x.domain() as [number,number]).thresholds(x.ticks(12));
    const b=bins(data.rows.map(r=>r[field]).filter(isNumber)),max=Math.max(d3.max(bins(result.rows.map(r=>r[field]).filter(isNumber)),b=>b.length)??1,d3.max(bins(previewResult!.rows.map(r=>r[field]).filter(isNumber)),b=>b.length)??1);
    const y=d3.scaleLinear().domain([0,max]).nice().range([c.height-c.m.bottom,c.m.top]);
    c.svg.append('g').attr('transform',`translate(0,${c.height-c.m.bottom})`).call(d3.axisBottom(x).ticks(4).tickFormat(d3.format('~s')));c.svg.append('g').attr('transform',`translate(${c.m.left},0)`).call(d3.axisLeft(y).ticks(4));
    c.svg.selectAll('rect').data(b).join('rect').attr('class','bar').attr('x',b=>x(b.x0!)+1).attr('y',b=>y(b.length)).attr('width',b=>Math.max(1,x(b.x1!)-x(b.x0!)-2)).attr('height',b=>y(0)-y(b.length));
    c.svg.append('text').attr('x',c.m.left).attr('y',10).text(field);
  });
}
function formOperation():Operation{
  if(ui.tool==='filter')return {type:'filter',params:{filters:structuredClone(ui.filters),mode:ui.mode}};
  if(ui.tool==='sort')return {type:'sort',params:{column:value('sort-column'),desc:value('sort-direction')==='descending'}};
  if(['fill','dropMissing','dedup'].includes(ui.tool))return {type:ui.tool,params:{column:value('clean-column'),method:value('fill-method'),value:value('fill-value')}};
  if(['group','pivot','month'].includes(ui.tool))return {type:ui.tool==='pivot'?'pivot':'group',params:{group:value('group-column'),value:value('group-value'),method:value('group-method'),pivot:value('pivot-column'),month:ui.tool==='month'}};
  if(ui.tool==='join')return {type:'join',params:{dataset:value('join-dataset'),leftKey:value('join-left'),rightKey:value('join-right'),how:value('join-how')}};
  return {type:'calculate',params:{name:value('calc-name').trim(),left:value('calc-left'),right:value('calc-right'),operator:value('calc-operator')}};
}
function pendingOperations(op?:Operation){return [...operations.slice(0,cursor),...(op?[op]:[])];}
function updatePreviewStatus(state?:Key){
  const status=$('[data-preview-status]');if(status)status.textContent=t(state??(previewResult?'previewReady':'previewPending'));
  const apply=$<HTMLButtonElement>('[data-action="apply-tool"]');if(apply)apply.disabled=!previewResult||busy;
}
function invalidatePreview(){previewToken++;previewResult=null;previewOp=null;ui.resultMode='after';$('[data-operation-summary]')?.replaceChildren();updatePreviewStatus();}
function requestPreview(delay=220){
  clearTimeout(previewTimer);invalidatePreview();if(!ui.tool||readOnlyTool()||inspecting())return;
  if(ui.tool==='filter'&&!ui.filters.length)return;
  const token=previewToken;updatePreviewStatus('previewUpdating');previewTimer=setTimeout(()=>void previewTool(token),delay);
}
async function previewTool(token=previewToken){
  if(!ui.tool||readOnlyTool()||inspecting()||ui.tool==='filter'&&!ui.filters.length)return;
  const op=formOperation(),dataset=source(),base=pendingOperations(op);
  try{const computed=await compute('replay',{dataset,operations:base,cursor:base.length,datasets});if(token!==previewToken||dataset.id!==active)return;previewResult=computed;previewOp=op;showNotice('');render();}
  catch(error){if(token!==previewToken)return;previewResult=null;previewOp=null;showNotice((error as Error).message);render();updatePreviewStatus('invalidPreview');}
}
async function perform(op?:Operation){
  if(busy||inspecting())return;busy=true;previewToken++;clearTimeout(previewTimer);render();
  try{
    const next=pendingOperations(op),computed=await compute('replay',{dataset:source(),operations:next,cursor:next.length,datasets});
    if(cursor<operations.length)source().branches=preserveBranch(source().branches??[],operations,cursor,t('branch'),crypto.randomUUID());
    lastSummary={op,before:result,after:computed};operations=next;cursor=next.length;result=computed;ui.filters=[];ui.page=0;ui.inspect=null;ui.tool='';previewResult=null;previewOp=null;normalizeFields();showNotice('');scheduleSave();
  }catch(error){showNotice((error as Error).message);}finally{busy=false;render();}
}
function cancelTool(){clearTimeout(previewTimer);invalidatePreview();ui.tool='';ui.filters=[];ui.page=0;scheduleSave();render();}
async function openTool(tool:string){
  if(inspecting())return;clearTimeout(previewTimer);invalidatePreview();ui.tool=tool;lastSummary=null;if(tool!=='filter')ui.filters=[];
  if(tool==='month'&&result.profile.find(p=>p.column===ui.groupColumn)?.type!=='date')ui.groupColumn=result.profile.find(p=>p.type==='date')?.column;
  scheduleSave();render();if(!readOnlyTool())requestPreview(0);
}
function download(content: string, filename: string, type='application/json') { const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000); }
async function importFiles(files: File[]) {
  if(!files.length)return;const added:Dataset[]=[];
  for(const file of files){if(file.size>10*1048576)throw new Error('fileTooLarge');let format=file.name.toLowerCase().split('.').at(-1)!;if(!['csv','tsv','json'].includes(format))throw new Error('unsupported');if(format==='csv')format=$<HTMLSelectElement>('[data-delimiter]')?.value??'csv';const raw=new TextDecoder($<HTMLSelectElement>('[data-encoding]')?.value??'utf-8',{fatal:true}).decode(await file.arrayBuffer());const data=await compute('parse',{raw,format});added.push({id:crypto.randomUUID(),name:file.name,format,raw,...data});}
  if(datasets.length+added.length>20||[...datasets,...added].reduce((n,d)=>n+new Blob([d.raw]).size,0)>20*1048576)throw new Error('workspaceLimit');
  source().operations=operations;source().cursor=cursor;datasets.push(...added);active=added[0].id;operations=[];cursor=0;ui.filters=[];ui.page=0;ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();
  await refresh();$<HTMLDialogElement>('[data-import-dialog]')?.close();scheduleSave();
}
async function onAction(action: string) {
  if(!ready||busy)return;
  if(action==='import'){showNotice('');$<HTMLDialogElement>('[data-import-dialog]')?.showModal();}
  else if(action==='close-import')$<HTMLDialogElement>('[data-import-dialog]')?.close();
  else if(action==='export'){const shown=shownResult();download(toCSV(shown===result?selectedRows():shown.rows,shown.columns),'data-loom-result.csv','text/csv;charset=utf-8');}
  else if(action==='backup'){const state=snapshot();download(JSON.stringify({...state,datasets:state.datasets.map(({rows,columns,...d})=>d)},null,2),'data-loom-workspace.hw03.json');}
  else if(action==='restore')$<HTMLInputElement>('[data-backup-file]')?.click();
  else if(action==='retry')await persist();
  else if(action==='toggle-sidebar'){ui.sidebarHidden=!ui.sidebarHidden;scheduleSave();render();}
  else if(action==='cancel-tool')cancelTool();
  else if(action==='preview-tool')await previewTool();
  else if(action==='apply-tool'){if(previewResult&&previewOp)await perform(previewOp);}
  else if(action==='clear-filters'){ui.filters=[];ui.page=0;invalidatePreview();scheduleSave();render();}
  else if(action==='keep-selected'||action==='exclude-selected'){
    if(ui.filters.length)await perform({type:'filter',params:{filters:structuredClone(ui.filters),mode:ui.mode,exclude:action==='exclude-selected'}});
  }
  else if(action==='add-filter'){
    const operator=value('filter-operator'),v=value('filter-value');if(['gte','lte'].includes(operator)&&(!v.trim()||!Number.isFinite(Number(v))))throw new Error('invalidNumber');
    ui.filters.push({column:value('filter-column'),operator:operator==='missingOp'?'missing':operator,value:v});ui.mode=value('filter-mode');ui.page=0;scheduleSave();render();requestPreview(0);
  }else if(action==='return-latest'){ui.inspect=null;ui.filters=[];ui.tool='';lastSummary=null;await refresh();scheduleSave();}
  else if(action==='continue-here'){
    const fork=forkHistory(source().branches??[],operations,cursor,viewCursor(),t('branch'),crypto.randomUUID());
    source().branches=fork.branches;operations=fork.operations;cursor=fork.cursor;ui.inspect=null;ui.filters=[];ui.tool='';await refresh();scheduleSave();
  }else if(action==='undo'||action==='redo'){invalidatePreview();ui.tool='';lastSummary=null;ui.inspect=null;cursor=Math.max(0,Math.min(operations.length,cursor+(action==='undo'?-1:1)));ui.filters=[];await refresh();scheduleSave();}
  else if(action==='previous'||action==='next'){const pages=Math.max(1,Math.ceil((previewResult&&ui.resultMode!=='before'?previewResult.rows:selectedRows()).length/50));ui.page=Math.max(0,Math.min(pages-1,ui.page+(action==='next'?1:-1)));scheduleSave();render();}
  else if(action==='reset'){if(confirm(t('resetConfirm'))){datasets=defaultDatasets();active=datasets[0].id;operations=[];cursor=0;ui.filters=[];ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();await refresh();scheduleSave();}}
  else if(action==='clear-storage'){if(confirm(t('clearConfirm'))){clearTimeout(saveTimer);await saveQueue;await storage.clear(revision);revision=0;autosave=false;saveStatus='unsaved';datasets=defaultDatasets();active=datasets[0].id;operations=[];cursor=0;ui.filters=[];ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();await refresh();await updateCapacity();}}
  else if(action==='paste'){const raw=$<HTMLTextAreaElement>('[data-paste]')?.value??'';await importFiles([new File([raw],'pasted.csv',{type:'text/csv'})]);}

}
const uiControlMap: Record<string,string> = {'chart-x':'x','scatter-x':'x','scatter-y':'y','chart-category':'category','clean-type':'cleanType','clean-column':'cleanColumn','fill-method':'fillMethod','fill-value':'fillValue','group-mode':'groupMode','group-column':'groupColumn','group-value':'groupValue','group-method':'groupMethod','pivot-column':'pivotColumn','join-dataset':'joinDataset','join-left':'joinLeft','join-right':'joinRight','join-how':'joinHow','calc-name':'calcName','calc-left':'calcLeft','calc-right':'calcRight','calc-operator':'calcOperator','filter-mode':'mode','filter-column':'filterColumn','filter-operator':'filterOperator','filter-value':'filterValue','sort-column':'sortColumn','sort-direction':'sortDirection'};
function mount() {
  root=document.querySelector('[data-loom]');if(!root)return;
  root.addEventListener('click',async e=>{
    const target=(e.target as Element).closest<HTMLElement>('button');if(!target||!ready||busy)return;
    try{
      if(target.dataset.action)await onAction(target.dataset.action);
      else if(target.dataset.section){ui.section=target.dataset.section;scheduleSave();render();if(ui.tool&&!readOnlyTool()&&!previewResult)requestPreview(0);}
      else if(target.dataset.tool)await openTool(target.dataset.tool);
      else if(target.dataset.viewMode){ui.view=target.dataset.viewMode;ui.page=0;scheduleSave();render();}
      else if(target.dataset.resultMode){ui.resultMode=target.dataset.resultMode;ui.page=0;scheduleSave();render();}
      else if(target.dataset.dataset){
        source().operations=operations;source().cursor=cursor;active=target.dataset.dataset;operations=source().operations??[];cursor=source().cursor??0;ui.filters=[];ui.page=0;ui.inspect=null;ui.tool='';lastSummary=null;invalidatePreview();await refresh();scheduleSave();
      }else if(target.dataset.field){
        const c=target.dataset.field;
        ui.selectedFields=(e.ctrlKey||e.metaKey)?ui.selectedFields.includes(c)?ui.selectedFields.filter((v:string)=>v!==c):[...ui.selectedFields,c]:[c];
        const p=result.profile.find(p=>p.column===c);
        if(['fill','dropMissing'].includes(ui.tool))ui.cleanColumn=c;
        else if(ui.tool==='filter')ui.filterColumn=c;
        else if(ui.tool==='sort')ui.sortColumn=c;
        else if(['group','pivot','month'].includes(ui.tool))ui.groupColumn=c;
        else if(ui.tool==='calculate'&&p?.type==='number')ui.calcLeft=c;
        else if(ui.tool==='join')ui.joinLeft=c;
        else if(p?.type==='number')ui.x=c;else if(p?.unique<=60)ui.category=c;
        scheduleSave();render();if(ui.tool&&!readOnlyTool())requestPreview();
      }else if(target.dataset.step){invalidatePreview();ui.inspect=Number(target.dataset.step);ui.tool='';ui.filters=[];lastSummary=null;await refresh();scheduleSave();}
      else if(target.dataset.removeFilter){ui.filters.splice(Number(target.dataset.removeFilter),1);ui.page=0;invalidatePreview();scheduleSave();render();if(ui.tool==='filter')requestPreview(0);}
      else if(target.dataset.sort){ui.sortColumn=target.dataset.sort;ui.sortDirection=ui.sortDirection==='ascending'?'descending':'ascending';ui.section='select';await openTool('sort');}
    }catch(error){showNotice((error as Error).message);}
  });
  root.addEventListener('toggle',e=>{const details=e.target as HTMLDetailsElement;if(details.dataset?.panel&&ui.panels[details.dataset.panel]!==details.open){ui.panels[details.dataset.panel]=details.open;scheduleSave();}},true);
  root.addEventListener('input',e=>{
    const target=e.target as HTMLInputElement;
    if(target.matches('[data-field-search]')){ui.fieldSearch=target.value;renderFields();scheduleSave();return;}
    if(target.dataset.control&&target.tagName!=='SELECT'){const key=uiControlMap[target.dataset.control];if(key){ui[key]=target.value;scheduleSave();requestPreview(450);}}
  });
  root.addEventListener('change',async e=>{
    if(busy)return;
    const target=e.target as HTMLInputElement;
    try{
      if(target.matches('[data-import-files]')){await importFiles(Array.from(target.files??[]));target.value='';}
      else if(target.matches('[data-backup-file]')){
        const file=target.files?.[0];if(!file)return;if(file.size>50*1048576)throw new Error('fileTooLarge');let parsed;try{parsed=JSON.parse(await file.text());}catch{throw new Error('backupInvalid');}
        const state=validateBackup(parsed);datasets=state.datasets;active=state.active;operations=state.operations;cursor=state.cursor;ui={...ui,...state.ui};ui.inspect=null;ui.tool='';invalidatePreview();lastSummary=null;await refresh();scheduleSave();target.value='';
      }else if(target.matches('[data-autosave]')){autosave=target.checked;if(!autosave){clearTimeout(saveTimer);await saveQueue;}else scheduleSave();updateStatus();}
      else if(target.matches('[data-branch-select]')&&target.value){
        const branch=source().branches?.find(b=>b.id===target.value);if(!branch)return;
        source().branches=preserveBranch(source().branches??[],operations,cursor,t('branch'),crypto.randomUUID()).filter((b:any)=>b.id!==branch.id);
        operations=structuredClone(branch.operations);cursor=branch.cursor;ui.inspect=null;ui.tool='';ui.filters=[];lastSummary=null;invalidatePreview();await refresh();scheduleSave();
      }else if(target.dataset.control){
        const key=uiControlMap[target.dataset.control];if(key){ui[key]=target.value;scheduleSave();
          if(['x','y','category'].includes(key)){render();return;}
          if(key==='joinDataset')ui.joinRight=datasets.find(d=>d.id===ui.joinDataset)?.columns[0];
          render();requestPreview();
        }
      }
    }catch(error){showNotice((error as Error).message);}
  });
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
  ready=true;await refresh();if(ui.tool&&!readOnlyTool()&&!inspecting())requestPreview(0);if(autosave&&revision===0)scheduleSave();void updateCapacity();
}
mount();void initialize();
document.addEventListener('astro:after-swap',mount);
let resizeTimer:ReturnType<typeof setTimeout>;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawCharts,120);});
