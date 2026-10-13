import {dtypeHTML} from './dtype-view';
import {asofHTML} from './asof-view';
import {axisHTML} from './axis-view';
import {explodeHTML} from './list-view';
import {displayValue} from './list-values.mjs';
import {alignmentHTML} from './alignment-view';
import {indexHTML} from './indexing-view';
import {groupToolsHTML} from './group-tools-view';
import {datetimeHTML,drawResample} from './datetime-view';
import {binningHTML,samplingHTML} from './binning-view';
import {calculationHTML} from './calculation-view';
import { windowsHTML, drawWindows } from './windows-view';
import {reshapeHTML} from './reshape-view';
import * as d3 from 'd3';
import {t,type Key} from './copy';
const esc=(value:any)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const format=(value:any)=>value==null?'—':typeof value==='number'?new Intl.NumberFormat(document.documentElement.lang==='en'?'en-US':'zh-CN',{maximumFractionDigits:4}).format(value):displayValue(value);
const metricLabels:Record<string,Key>={field:'column',type:'dataType',count:'count',missing:'missing',unique:'unique',top:'topValue',freq:'frequency',mean:'mean',std:'std',var:'var',min:'min',q1:'q1',median:'median',q3:'q3',max:'max',iqr:'iqrRange',quantile:'quantileLevel',value:'value'};
function statisticsTable(data:any){
  const a=data.analysis,labels=a.kind==='frequencies'?{[a.countName]:'frequency',[a.proportionName]:'proportion',[a.cumulativeName]:'cumulative'} as Record<string,Key>:metricLabels;
  const limit=a.kind==='frequencies'?100:200;
  return `<p class="loom-help">${data.rows.length>limit?`${t('displayLimit')} ${limit} / ${format(data.rows.length)}. `:''}${a.kind==='frequencies'?`${t('validRecords')}: ${format(a.total)}`:''}</p><div class="loom-table-wrap"><table><thead><tr>${data.columns.map((c:string)=>`<th>${esc(labels[c]?t(labels[c]):c)}</th>`).join('')}</tr></thead><tbody>${data.rows.slice(0,limit).map((row:any)=>`<tr>${data.columns.map((c:string)=>`<td class="${typeof row[c]==='number'?'numeric':''}">${esc(c==='type'&&a.kind==='describe'?t(row[c] as Key):format(row[c]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function statisticsHTML(data:any,pair:any,pending:boolean) {
  const a=data.analysis;
  if(a.kind==='columnRename')return `<section class="loom-card loom-statistics"><h2>${t('renameMapping')}</h2><div class="loom-string-mappings">${Object.entries(a.mapping).map(([before,after])=>`<div class="loom-string-mapping"><span>${esc(before)}</span><span>→</span><span>${esc(after)}</span></div>`).join('')}</div></section>`;
  if(a.kind==='dtype')return dtypeHTML(data);
  if(a.kind==='asof')return asofHTML(data);
  if(a.kind==='extractAll')return `<section class="loom-card loom-statistics"><h2>${t('extractAllTool')}</h2><p>${t('extractAllHint')}</p><div class="loom-relational-flow"><div>${t('rows')}<strong>${a.sourceRows}</strong></div><span>→</span><div>${t('rows')}<strong>${a.outputRows}</strong></div><div>${t('matchesCount')}<strong>${a.matched}</strong></div></div><p>${t('displayLimit')}: 30</p><div class="loom-table-wrap"><table><thead><tr><th>${t('indexSourcePosition')}</th><th>${t('extractMatchName')}</th><th>${t('rowPositions')}</th><th>${t('value')}</th></tr></thead><tbody>${a.mapping.map((m:any)=>`<tr><th>${m.source}</th><td>${m.match}</td><td>${m.start} → ${m.end}</td><td>${esc(m.text)}</td></tr>`).join('')}</tbody></table></div></section>`;
  if(a.kind==='axisReshape')return axisHTML(data);
  if(a.kind==='explode')return explodeHTML(data);
  if(a.kind==='alignment')return alignmentHTML(data);
  if(a.kind==='index')return indexHTML(data);
  if(['groupFilter','groupRank'].includes(a.kind))return groupToolsHTML(data);
  if(['datetime','resample'].includes(a.kind))return datetimeHTML(data);
  if(a.kind==='binning')return binningHTML(data);
  if(a.kind==='sampling')return samplingHTML(data);
  if(a.kind==='calculation')return calculationHTML(data);
  if(a.kind==='strings')return `<section class="loom-card loom-statistics"><h2>${t('stringMapping')}</h2><p>${t('stringValid')}: <strong>${format(a.valid)} / ${format(a.total)}</strong> · ${t('columns')}: ${format(a.fields.length)}</p><div class="loom-match-track"><i style="width:${a.total?a.valid/a.total*100:0}%"></i></div><p>${t('stringExamples')}</p><div class="loom-string-mappings">${a.samples.map((sample:any)=>`<div class="loom-string-mapping"><div>${sample.before.map((v:any)=>`<p><small>${esc(v.name)}</small><span>${esc(format(v.value))}</span></p>`).join('')}</div><span aria-hidden="true">→</span><div>${sample.after.map((v:any)=>`<p><small>${esc(v.name)}</small><span>${esc(format(v.value))}</span></p>`).join('')}</div></div>`).join('')}</div></section>`;
  if(a.kind==='windows')return windowsHTML(data);
  if(a.kind==='reshape'||a.kind==='pivotMulti')return reshapeHTML(data);
  if(a.kind==='merge'){
    const rate=(matched:number,total:number)=>total?matched/total*100:0;
    return `<section class="loom-card loom-statistics"><h2>${t('mergeDiagnostics')}</h2><div class="loom-relational-flow"><div>${t('leftInput')}<strong>${format(a.leftRows)}</strong>${t('matchedSourceRows')}: ${format(rate(a.leftMatched,a.leftRows))}%<div class="loom-match-track"><i style="width:${rate(a.leftMatched,a.leftRows)}%"></i></div></div><span aria-hidden="true">↔</span><div>${t('rightInput')}<strong>${format(a.rightRows)}</strong>${t('matchedSourceRows')}: ${format(rate(a.rightMatched,a.rightRows))}%<div class="loom-match-track"><i style="width:${rate(a.rightMatched,a.rightRows)}%"></i></div></div><span aria-hidden="true">→</span><div>${t('rows')}<strong>${format(data.rows.length)}</strong>${(['both','left_only','right_only'] as Key[]).map(k=>`<p>${t(k==='both'?'bothMatched':k)}: ${format(a.counts[k])}</p>`).join('')}</div></div><h3>${t('keyExamples')}</h3><div class="loom-table-wrap"><table><thead><tr><th>${t('keyValues')}</th><th>${t('leftInput')}</th><th>${t('rightInput')}</th></tr></thead><tbody>${a.keyGroups.map((g:any)=>`<tr><td>${esc(g.keys.map(format).join(' / '))}</td><td>${format(g.left)}</td><td>${format(g.right)}</td></tr>`).join('')}</tbody></table></div>${statisticsTable(data)}</section>`;
  }
  if(a.kind==='concat')return `<section class="loom-card loom-statistics"><h2>${t('concatDiagnostics')}</h2><p>${t('concatHint')}</p><div class="loom-relational-flow">${a.sources.map((s:any)=>`<div>${esc(s.name)}<strong>${format(s.rows)} × ${format(s.columns)}</strong></div>`).join('<span aria-hidden="true">+</span>')}<span aria-hidden="true">→</span><div>${t('applied')}<strong>${format(a.outputRows)} × ${format(a.outputColumns)}</strong></div></div>${statisticsTable(data)}</section>`;
  if(a.kind==='groupMulti')return `<section class="loom-card loom-statistics"><h2>${t('groupMultiTool')}</h2><p>${t('groupCount')}: <strong>${format(a.groups)}</strong> · ${t('excludedGroupRows')}: ${format(a.excluded)}</p><p>${t('groupChartHint')}</p><div class="loom-chart-grid">${a.metrics.map((metric:any,i:number)=>`<section><h3>${esc(metric.name)}</h3><div data-stat-group="${i}" class="loom-chart"></div></section>`).join('')}</div>${statisticsTable(data)}</section>`;
  if(a.kind==='correlation'){
    const limit=40,fields=a.fields.slice(0,limit);
    const extent=a.method==='covariance'?Math.max(1,...a.matrix.flat().filter((v:any)=>v!=null).map(Math.abs)):1;
    const matrix=`<div class="loom-table-wrap"><table class="loom-matrix"><thead><tr><th>${t('column')}</th>${fields.map((c:string)=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${fields.map((c:string,i:number)=>`<tr><th>${esc(c)}</th>${fields.map((key:string,j:number)=>{const value=a.matrix[i][j],n=a.counts[i][j],strength=value==null?0:Math.min(1,Math.abs(value)/extent);return `<td><button data-stat-pair="${i},${j}" aria-label="${esc(`${c} / ${key}: ${format(value)}; ${t('validPairs')} ${n}`)}" style="--stat-strength:${strength};--stat-color:${value<0?'var(--stat-negative)':'var(--stat-positive)'}"><strong>${esc(format(value))}</strong><small>n = ${format(n)}</small></button></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<section class="loom-card loom-statistics"><h2>${t('correlationTool')} · ${t(a.method)}</h2><p>${t('correlationHint')}</p>${a.method==='covariance'?`<p>${t('degreesFreedom')}: ${a.ddof}. ${a.ddof!==a.requestedDdof?t('covarianceMissingHint'):''}</p>`:''}<div class="loom-matrix-legend"><span>${t('negativeRelation')}</span><i></i><span>${t('positiveRelation')}</span></div>${a.fields.length>limit?`<p>${t('displayLimit')} ${limit} / ${a.fields.length}. ${t('fullExportHint')}</p>`:''}${matrix}<section class="loom-pair-detail" aria-live="polite">${pending?`<p>${t('busy')}</p>`:pair?`<h3>${esc(pair.x)} / ${esc(pair.y)}</h3><p>${t('validPairs')}: ${format(pair.count)} · ${t('displayedPoints')}: ${format(pair.points.length)}</p><p>${t('pairReadOnly')}</p><div data-stat-scatter class="loom-chart"></div>`:`<p>${t('selectCorrelationPair')}</p>`}</section></section>`;
  }
  if(a.kind==='describe'||a.kind==='iqr'){
    return `<section class="loom-card loom-statistics"><h2>${t(a.kind==='iqr'?'iqrTool':'describeTool')}</h2><p>${t('boxHint')}</p>${a.kind==='iqr'?`<p>${t('affectedRows')}: <strong>${format(a.affected)}</strong> · ${t('iqrFactor')}: ${format(a.factor)}</p>`:''}<div class="loom-box-list">${a.boxes.map((box:any,i:number)=>`<section><div class="loom-card-heading"><h3>${esc(box.column)}</h3><span>${t('outliers')}: ${format(box.outliers)} / ${format(box.count)}</span></div><div data-stat-box="${i}" class="loom-box-chart"></div><p>${t('iqrFences')}: ${format(box.lower)} – ${format(box.upper)} · Q1 ${format(box.q1)} · ${t('median')} ${format(box.median)} · Q3 ${format(box.q3)}</p></section>`).join('')}</div>${a.kind==='describe'?statisticsTable(data):`<p>${t('iqrHint')}</p>`}</section>`;
  }
  return `<section class="loom-card loom-statistics"><h2>${t(a.kind==='frequencies'?'frequenciesTool':'quantilesTool')}</h2>${a.kind==='frequencies'?`<p>${t('frequencyHint')}</p><div data-stat-frequency class="loom-chart"></div>`:''}${statisticsTable(data)}</section>`;
}
function svgChart(element:HTMLElement,height:number,left=48){
  element.replaceChildren();const width=Math.max(280,element.clientWidth);
  const svg=d3.select(element).append('svg').attr('viewBox',`0 0 ${width} ${height}`).attr('role','img');
  return {svg,width,height,left,right:20,bottom:32,top:16};
}
export function drawStatistics(root:HTMLElement,data:any,pair:any){
  const a=data.analysis;if(!a)return;
  if(a.kind==='resample'){drawResample(root,data);return;}
  if(a.kind==='windows'){drawWindows(root,data);return;}
  root.querySelectorAll<HTMLElement>('[data-stat-box]').forEach(element=>{
    const box=a.boxes[Number(element.dataset.statBox)],g=svgChart(element,100,28);g.svg.attr('aria-label',`${box.column}: Q1 ${format(box.q1)}, ${t('median')} ${format(box.median)}, Q3 ${format(box.q3)}`);
    if(!box.count){element.textContent=t('noNumeric');return;}
    let lo=box.min,hi=box.max;if(lo===hi){lo-=.5;hi+=.5;}
    const x=d3.scaleLinear().domain([lo,hi]).nice().range([g.left,g.width-g.right]),y=38;
    g.svg.append('g').attr('transform','translate(0,70)').call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('~s')));
    g.svg.append('line').attr('x1',x(box.whiskerLow)).attr('x2',x(box.whiskerHigh)).attr('y1',y).attr('y2',y).attr('class','loom-box-whisker');
    [box.whiskerLow,box.whiskerHigh].forEach(v=>g.svg.append('line').attr('x1',x(v)).attr('x2',x(v)).attr('y1',y-12).attr('y2',y+12).attr('class','loom-box-whisker'));
    g.svg.append('rect').attr('x',x(box.q1)).attr('y',y-16).attr('width',Math.max(1,x(box.q3)-x(box.q1))).attr('height',32).attr('class','loom-box-body');
    g.svg.append('line').attr('x1',x(box.median)).attr('x2',x(box.median)).attr('y1',y-16).attr('y2',y+16).attr('class','loom-box-whisker');
    for(const bound of [box.lower,box.upper])if(bound>=lo&&bound<=hi)g.svg.append('line').attr('x1',x(bound)).attr('x2',x(bound)).attr('y1',12).attr('y2',64).attr('class','loom-box-fence');
    g.svg.selectAll('circle').data(box.points).join('circle').attr('cx',(v:any)=>x(v)).attr('cy',(_,i)=>y+(i%3-1)*5).attr('r',3).attr('class','loom-box-outlier').append('title').text(v=>format(v));
  });
  root.querySelectorAll<HTMLElement>('[data-stat-group]').forEach(element=>{
    const metric=a.metrics[Number(element.dataset.statGroup)],rows=a.summary;
    const numeric=rows.filter((r:any)=>typeof r[metric.name]==='number'&&Number.isFinite(r[metric.name]));
    if(!numeric.length){element.textContent=t('noNumeric');return;}
    const names=rows.map((r:any)=>a.keys.length?a.keys.map((k:string)=>format(r[k])).join(' / '):t('summarize'));
    const g=svgChart(element,Math.max(230,rows.length*28+52),60),values=numeric.map((r:any)=>r[metric.name]);g.left=Math.min(160,g.width*.43);
    let lo=Math.min(0,...values),hi=Math.max(0,...values);if(lo===hi)hi=lo+1;
    const x=d3.scaleLinear().domain([lo,hi]).nice().range([g.left,g.width-g.right]);
    const y=d3.scaleBand<string>().domain(rows.map((_:any,i:number)=>String(i))).range([g.top,g.height-g.bottom]).padding(.25);
    g.svg.attr('aria-label',metric.name);g.svg.append('g').attr('transform',`translate(0,${g.height-g.bottom})`).call(d3.axisBottom(x).ticks(4).tickFormat(d3.format('~s')));
    const axis=g.svg.append('g').attr('transform',`translate(${g.left},0)`).call(d3.axisLeft(y).tickFormat(v=>names[Number(v)].length>19?names[Number(v)].slice(0,18)+'…':names[Number(v)]));axis.selectAll('.tick').append('title').text((v:any)=>names[Number(v)]);
    g.svg.append('line').attr('x1',x(0)).attr('x2',x(0)).attr('y1',g.top).attr('y2',g.height-g.bottom).attr('stroke','currentColor');
    g.svg.selectAll('rect').data(rows).join('rect').attr('y',(_:any,i:number)=>y(String(i))!).attr('x',(r:any)=>x(Math.min(0,Number(r[metric.name])||0))).attr('height',y.bandwidth()).attr('width',(r:any)=>typeof r[metric.name]==='number'?Math.abs(x(r[metric.name])-x(0)):0).attr('class','bar').append('title').text((r:any,i:number)=>`${names[i]}: ${format(r[metric.name])}`);
  });
  const frequency=root.querySelector<HTMLElement>('[data-stat-frequency]');
  if(frequency){
    const g=svgChart(frequency,230),rows=data.rows.slice(0,12),names=rows.map((r:any)=>a.keys.map((k:string)=>format(r[k])).join(' / '));
    const x=d3.scaleBand<string>().domain(names).range([g.left,g.width-g.right]).padding(.3),y=d3.scaleLinear().domain([0,d3.max<any,number>(rows,(r:any)=>Number(r[a.countName]))||1]).nice().range([g.height-g.bottom,g.top]);
    g.svg.attr('aria-label',t('frequenciesTool'));g.svg.append('g').attr('transform',`translate(0,${g.height-g.bottom})`).call(d3.axisBottom(x).tickFormat(v=>v.length>12?v.slice(0,11)+'…':v));g.svg.append('g').attr('transform',`translate(${g.left},0)`).call(d3.axisLeft(y).ticks(4));
    g.svg.selectAll('rect').data(rows).join('rect').attr('x',(_:any,i:number)=>x(names[i])!).attr('y',(r:any)=>y(r[a.countName])).attr('width',x.bandwidth()).attr('height',(r:any)=>y(0)-y(r[a.countName])).attr('class','bar').append('title').text((r:any,i)=>`${names[i]}: ${format(r[a.countName])}; ${format(r[a.proportionName]*100)}%`);
  }
  const scatter=root.querySelector<HTMLElement>('[data-stat-scatter]');
  if(scatter&&pair){
    if(!pair.points.length){scatter.textContent=t('noRows');return;}
    const g=svgChart(scatter,280,60);g.bottom=48;const domain=(key:string)=>{let [lo,hi]=d3.extent<any,number>(pair.points,(p:any)=>Number(p[key])) as [number,number];if(lo===hi){lo-=.5;hi+=.5;}return [lo,hi];};
    const x=d3.scaleLinear().domain(domain('x')).nice().range([g.left,g.width-g.right]),y=d3.scaleLinear().domain(domain('y')).nice().range([g.height-g.bottom,g.top]);
    g.svg.attr('aria-label',`${pair.x} / ${pair.y}`);g.svg.append('g').attr('transform',`translate(0,${g.height-g.bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('~s')));g.svg.append('g').attr('transform',`translate(${g.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')));
    g.svg.append('text').attr('x',g.width/2).attr('y',g.height-4).attr('text-anchor','middle').text(pair.x);g.svg.append('text').attr('transform','rotate(-90)').attr('x',-g.height/2).attr('y',14).attr('text-anchor','middle').text(pair.y);
    g.svg.selectAll('circle').data(pair.points).join('circle').attr('cx',(p:any)=>x(p.x)).attr('cy',(p:any)=>y(p.y)).attr('r',3).attr('class','loom-stat-point').append('title').text((p:any)=>`${pair.x}: ${format(p.x)}; ${pair.y}: ${format(p.y)}`);
  }
}
