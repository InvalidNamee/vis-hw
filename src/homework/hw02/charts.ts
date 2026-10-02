import * as d3 from 'd3';
import {dataset,text,type Lang} from './content';
import {calculate,defaults} from './model.mjs';
import {drawExplanation} from './graphs';

type Svg = d3.Selection<SVGSVGElement, null, HTMLElement, unknown>;
const palette=['var(--hw-blue)','var(--hw-mint)','var(--hw-purple)','var(--hw-orange)'];
const stateEvent='hw02:state';
function setParams(values:Record<string,string>){
 const url=new URL(location.href);
 for(const [key,value] of Object.entries(values))url.searchParams.set(key,value);
 history.replaceState(history.state,'',url);
 window.dispatchEvent(new Event(stateEvent));
}
const fromUrl=(key:string,fallback:string)=>new URL(location.href).searchParams.get(key)??fallback;

class AiViz extends HTMLElement {
 private abort?:AbortController;
 private resize?:ResizeObserver;
 private story?:IntersectionObserver;
 private theme?:MutationObserver;
 private frame=0;
 private timer?:d3.Timer;
 private locale:Lang='zh';
 private kind='';
 private step=0;
 private view='network';
 private playing=false;
 private elapsed=0;
 private lastWidth=0;
 private t=(zh:string,en:string)=>text(this.locale,zh,en);
 private q<T extends Element=HTMLElement>(s:string){return this.querySelector<T>(s)!;}
 private status(message:string){const p=this.querySelector('[data-status]');if(p)p.textContent=message;}
 private value(key:string){return this.q<HTMLInputElement|HTMLSelectElement>(`[data-control="${key}"]`)?.value??'';}
 private motion(){return !matchMedia('(prefers-reduced-motion: reduce)').matches;}
 private duration(){return this.motion()?450:0;}
 private controlDefaults=new Map<string,string>();
 connectedCallback(){this.frame=requestAnimationFrame(()=>this.mount());}
 disconnectedCallback(){
  cancelAnimationFrame(this.frame);this.abort?.abort();this.resize?.disconnect();this.story?.disconnect();this.theme?.disconnect();this.timer?.stop();
  d3.select(this).selectAll('*').interrupt();
 }
 private mount(){
  if(!this.isConnected)return;
  this.kind=this.dataset.kind!;this.locale=this.dataset.lang as Lang;this.abort=new AbortController();
  const opts={signal:this.abort.signal};
  this.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-control]').forEach(control=>{
   const key=control.dataset.control!;
   this.controlDefaults.set(key,control.value);
   const restore=()=>{
    const raw=fromUrl(key,this.controlDefaults.get(key)!);
    if(control instanceof HTMLSelectElement)control.value=Array.from(control.options).some(o=>o.value===raw)?raw:this.controlDefaults.get(key)!;
    else if(control.type==='range'){
     const v=Number(raw);control.value=String(Number.isFinite(v)?Math.min(Number(control.max),Math.max(Number(control.min),v)):this.controlDefaults.get(key));
    }else control.value=raw;
   };
   restore();
   const event=control instanceof HTMLInputElement?'input':'change';
   control.addEventListener(event,()=>{
    this.playing=false;this.elapsed=0;
    setParams({[key]:control.value});this.render();
   },opts);
  });
  const restore=()=>{
   this.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-control]').forEach(c=>{
    const raw=fromUrl(c.dataset.control!,this.controlDefaults.get(c.dataset.control!)!);
    if(c instanceof HTMLSelectElement)c.value=Array.from(c.options).some(o=>o.value===raw)?raw:this.controlDefaults.get(c.dataset.control!)!;
    else c.value=raw;
   });
   this.view=fromUrl('view','network')==='matrix'?'matrix':'network';
   this.playing=false;this.elapsed=0;this.render();
  };
  window.addEventListener('popstate',restore,opts);
  this.view=fromUrl('view','network')==='matrix'?'matrix':'network';
  this.addEventListener('click',e=>{
   const target=(e.target as Element).closest<HTMLElement>('button');if(!target)return;
   if(target.dataset.step!==undefined){this.step=Number(target.dataset.step);this.render();}
   if(target.dataset.view){this.view=target.dataset.view;setParams({view:this.view});this.render();}
   switch(target.dataset.action){
    case 'reset':
     if(this.kind==='adoption'){const url=new URL(location.href);url.searchParams.delete('range');history.replaceState(history.state,'',url);}
     this.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-control]').forEach(c=>c.value=this.controlDefaults.get(c.dataset.control!)!);
     if(this.kind==='industry')this.view='network';
     setParams({...Object.fromEntries(this.controlDefaults),...(this.kind==='industry'?{view:'network'}:{})});
     this.elapsed=0;this.playing=false;this.render();break;
    case 'play':this.playing=!this.playing;this.render();break;
    case 'replay':this.elapsed=0;this.playing=true;this.render();break;
    case 'share': void this.share();break;
   }
  },opts);
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden){this.timer?.stop();if(this.playing){this.playing=false;this.updatePlayButton();}}
  },opts);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',()=>{this.playing=false;this.elapsed=0;this.render();},opts);
  if(this.kind==='sensitivity')window.addEventListener(stateEvent,()=>this.render(),opts);
  if(this.kind==='hero'){
   this.story=new IntersectionObserver(entries=>{const active=entries.find(e=>e.isIntersecting);if(active){this.step=Number((active.target as HTMLElement).dataset.storyStep)+1;this.render();}},{threshold:.6});
   document.querySelectorAll('[data-story-step]').forEach(e=>this.story!.observe(e));
  }
  this.theme=new MutationObserver(()=>this.render());
  this.theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const style=getComputedStyle(this);
  this.lastWidth=Math.round(this.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
  this.resize=new ResizeObserver(entries=>{
   const width=Math.round(entries[0].contentRect.width);if(Math.abs(width-this.lastWidth)>2){this.lastWidth=width;cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>this.render());}
  });this.resize.observe(this);
  this.render();
 }
 private async share(){
  setParams(Object.fromEntries(Array.from(this.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-control]')).map(c=>[c.dataset.control!,c.value])));
  try{await navigator.clipboard.writeText(location.href);this.status(this.t('情景链接已复制。','Scenario link copied.'));}
  catch{this.status(this.t('请复制地址栏中的链接，参数已保存。','Copy the address bar URL; your parameters are saved.'));}
 }
 private svg(height:number,clear=true):{svg:Svg,w:number,h:number}{
  const stage=this.q('[data-chart]'),w=Math.max(260,stage.clientWidth);
  const svg=d3.select(stage).selectAll<SVGSVGElement,unknown>('svg').data([null]).join('svg').attr('viewBox',`0 0 ${w} ${height}`).attr('role','img').attr('aria-label',this.q('h2').textContent) as Svg;
  if(clear){svg.selectAll('*').interrupt();svg.selectAll('*').remove();}
  return {svg,w,h:height};
 }
 private render(){
  if(!this.isConnected)return;
  this.timer?.stop();
  switch(this.kind){
   case 'hero':this.hero();break;
   case 'adoption':this.adoption();break;
   case 'investment':this.investment();break;
   case 'industry':this.industry();break;
   case 'effects':this.effects();break;
   case 'skills':this.skills();break;
   case 'lab':this.lab();break;
   case 'sensitivity':this.sensitivity();break;
   case 'energy':this.energy();break;
   case 'sources':this.sources();break;
   case 'pathway':case 'collaboration':case 'infrastructure':{
    const {svg,w}=this.svg(this.q('[data-chart]').clientWidth<600?340:250);
    drawExplanation(svg,w,this.kind,this.locale,message=>this.status(message));break;
   }
  }
 }
 private label(svg:Svg,x:number,y:number,message:string,cls='label',anchor='start'){
  return svg.append('text').attr('x',x).attr('y',y).attr('class',cls).attr('text-anchor',anchor).text(message);
 }
 private hero(){
  const {svg,w}=this.svg(320),cx=w/2,cy=156;
  svg.attr('role','group');
  const stages=[
   [this.t('数据','Data'),this.t('算力','Compute'),this.t('人才','People')],
   [this.t('识别','Vision'),this.t('预测','Prediction'),this.t('生成','Generation')],
   [this.t('制造','Industry'),this.t('科研','Science'),this.t('服务','Services')],
   [this.t('效率','Efficiency'),this.t('质量','Quality'),this.t('创新','Innovation')]
  ];
  const radius=Math.min(w*.36,120);
  [radius*.65,radius,radius+20].forEach((r,i)=>svg.append('circle').attr('cx',cx).attr('cy',cy).attr('r',r).attr('fill','none').attr('stroke','var(--border-soft)').attr('stroke-dasharray',i===2?'2 7':null));
  const nodes=stages.flatMap((labels,group)=>labels.map((label,i)=>({label,group,angle:(group*3+i)/12*Math.PI*2-Math.PI/2})));
  const g=svg.append('g');
  nodes.forEach(n=>{
   const x=cx+Math.cos(n.angle)*radius,y=cy+Math.sin(n.angle)*radius;
   const active=n.group===this.step;
   g.append('path').attr('d',`M${cx},${cy} Q${(cx+x)/2+15},${(cy+y)/2-15} ${x},${y}`).attr('fill','none').attr('stroke',active?palette[n.group]:'var(--border-soft)').attr('stroke-width',active?1.8:1).attr('stroke-dasharray',active?null:'3 5');
   const node=g.append('g').attr('class','node').attr('tabindex',0).attr('role','button').attr('aria-label',n.label).attr('aria-pressed',String(active)).on('click',()=>{this.step=n.group;this.render();}).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.step=n.group;this.render();}});
   node.append('circle').attr('cx',x).attr('cy',y).attr('r',active?22:17).attr('fill',active?'var(--accent-soft)':'var(--surface)').attr('stroke',active?palette[n.group]:'var(--border-strong)').attr('stroke-width',active?1.8:1);
   node.append('text').attr('x',x).attr('y',y+4).attr('text-anchor','middle').attr('fill',active?palette[n.group]:'var(--text-subtle)').attr('font-size',this.locale==='en'?8:10).text(n.label);
  });
  svg.append('circle').attr('cx',cx).attr('cy',cy).attr('r',40).attr('fill','var(--hw-blue)').attr('opacity',.07);
  svg.append('circle').attr('cx',cx).attr('cy',cy).attr('r',31).attr('fill','var(--hw-blue)');
  svg.append('text').attr('x',cx).attr('y',cy+8).attr('text-anchor','middle').attr('fill',document.documentElement.classList.contains('dark')?'#172039':'#fff').attr('font-size',25).attr('font-weight',600).text('AI');
  this.querySelectorAll<HTMLElement>('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===this.step)));
  const captions=[this.t('数据、算力与人才，共同构成应用的基础。','Data, compute, and people provide the foundations.'),this.t('将输入转化为识别、预测与生成能力。','Inputs become recognition, prediction, and generation.'),this.t('进入具体任务，才可能改变生产流程。','Capabilities must enter tasks to change a workflow.'),this.t('效率、质量与创新，是检验价值的方向。','Look for gains in efficiency, quality, and innovation.')];
  this.status(captions[this.step]);
  svg.selectAll('g.node').attr('opacity',.3).transition().duration(this.duration()).attr('opacity',1);
 }
 private adoption(){
  const {svg,w}=this.svg(320),m={l:42,r:28,t:30,b:80},bottom=240;
  const records=dataset.records.filter(r=>r.id.startsWith('adoption-'));
  const x=d3.scaleLinear().domain([2022.85,2025.15]).range([m.l,w-m.r]);
  const y=d3.scaleLinear().domain([0,100]).range([bottom,m.t]);
  svg.append('g').attr('class','grid').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(w-m.l-m.r)).tickFormat(()=>''));
  svg.append('g').attr('transform',`translate(0,${bottom})`).call(d3.axisBottom(x).tickValues([2023,2024,2025]).tickFormat(d3.format('d')));
  svg.append('g').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v=>`${v}%`));
  svg.append('path').datum(records).attr('d',d3.area<typeof records[number]>().x(d=>x(d.period)).y0(bottom).y1(d=>y(d.value))).attr('fill','var(--hw-blue)').attr('opacity',.07);
  svg.append('path').datum(records).attr('fill','none').attr('stroke','var(--hw-blue)').attr('stroke-width',2.5).attr('d',d3.line<typeof records[number]>().x(d=>x(d.period)).y(d=>y(d.value)));
  svg.selectAll<SVGCircleElement, typeof records[number]>('circle.point').data(records,d=>d.id).join('circle').attr('class','point').attr('cx',d=>x(d.period)).attr('cy',d=>y(d.value)).attr('r',5).attr('fill','var(--surface)').attr('stroke','var(--hw-blue)').attr('stroke-width',2.5).append('title').text(d=>`${d.period}: ${d.value}%`);
  const labels=svg.selectAll('text.point-label').data(records).join('text').attr('class','value-label point-label').attr('x',d=>x(d.period)).attr('y',d=>y(d.value)-16).attr('text-anchor','middle').text(d=>`${d.value}%`);
  const focus=(start:number,end:number)=>{
   svg.selectAll<SVGCircleElement,typeof records[number]>('circle.point').attr('opacity',d=>d.period>=start&&d.period<=end?1:.2);
   labels.attr('opacity',d=>d.period>=start&&d.period<=end?1:.2);
   const rows=records.filter(d=>d.period>=start&&d.period<=end);
   this.status(rows.length?rows.map(d=>`${d.period}: ${d.value}%`).join('  /  '):this.t('此范围内没有已报告的年份。','No reported years in this range.'));
  };
  const brush=d3.brushX<null>().extent([[m.l,280],[w-m.r,306]]).on('brush end',e=>{
   if(!e.selection){focus(2023,2025);return;}
   const [a,b]=(e.selection as [number,number]).map(x.invert);
   focus(a,b);
   if(e.sourceEvent){this.q<HTMLSelectElement>('[data-control=year]').value='all';setParams({year:'all',range:`${a.toFixed(3)},${b.toFixed(3)}`});}
  });
  const bg=svg.append('g');bg.append('rect').attr('x',m.l).attr('y',280).attr('width',w-m.l-m.r).attr('height',26).attr('rx',4).attr('fill','var(--accent-soft)');bg.call(brush);bg.selectAll('.selection').attr('fill','var(--hw-blue)').attr('fill-opacity',.15).attr('stroke','var(--hw-blue)');
  const year=this.value('year');
  if(year!=='all')bg.call(brush.move,[x(+year-.1),x(+year+.1)]);
  else{
   const range=fromUrl('range','').split(',').map(Number);
   if(range.length===2&&range.every(Number.isFinite)&&range[0]<range[1]&&range[0]>=2022.85&&range[1]<=2025.15)bg.call(brush.move,range.map(x) as [number,number]);
   else bg.call(brush.move,[x(2022.9),x(2025.1)]);
  }
 }
 private investment(){
  const {svg,w}=this.svg(265,false);
  const records=dataset.records.filter(r=>r.id.startsWith('investment-')).sort((a,b)=>this.value('sort')==='asc'?a.value-b.value:b.value-a.value);
  const left=this.locale==='en'?102:54,right=40;
  const x=d3.scaleLinear().domain([0,120]).range([left,w-right]);
  const y=d3.scaleBand().domain(records.map(d=>d.id)).range([35,218]).padding(.44);
  svg.selectAll<SVGGElement, null>('g.x-axis').data([null]).join('g').attr('class','x-axis').attr('transform','translate(0,225)').call(d3.axisBottom(x).ticks(w<400?3:5));
  const rows=svg.selectAll<SVGGElement,typeof records[number]>('g.bar-row').data(records,d=>d.id).join(enter=>{
   const row=enter.append('g').attr('class','bar-row');row.append('rect').attr('rx',4);row.append('text').attr('class','name label');row.append('text').attr('class','value value-label');return row;
  });
  rows.transition().duration(this.duration()).attr('transform',d=>`translate(0,${y(d.id)})`);
  rows.select('rect').attr('x',left).attr('height',y.bandwidth()).attr('fill','var(--hw-blue)').attr('opacity',d=>d.id==='investment-us'?.9:.5).transition().duration(this.duration()).attr('width',d=>x(d.value)-left);
  rows.select('.name').attr('x',left-10).attr('y',y.bandwidth()/2+4).attr('text-anchor','end').style('font-size','10px').text(d=>d.label[this.locale]);
  rows.select('.value').attr('y',y.bandwidth()/2+4).style('font-size','12px').text(d=>d.value).transition().duration(this.duration()).attr('x',d=>x(d.value)+6);
  this.status(this.t('2024 年快照：比较投资规模，不推断国家生产率。','A 2024 snapshot of investment, not a productivity comparison.'));
 }
 private selectIndustry(id:string){
  const control=this.q<HTMLSelectElement>('[data-control=industry]');control.value=id;setParams({industry:id});this.render();
 }
 private industry(){
  const selected=this.value('industry')||'manufacturing';
  document.querySelectorAll<HTMLElement>('[data-case]').forEach(c=>{c.hidden=c.dataset.case!==selected;});
  this.querySelectorAll<HTMLElement>('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===this.view)));
  const {svg,w}=this.svg(420);svg.attr('role','group');
  if(this.view==='matrix'){
   const left=this.locale==='en'?108:65,top=60;
   const x=d3.scaleBand().domain(dataset.capabilities.map(c=>c.id)).range([left,w-10]).padding(.1);
   const y=d3.scaleBand().domain(dataset.cases.map(c=>c.id)).range([top,390]).padding(.18);
   dataset.capabilities.forEach(c=>this.label(svg,x(c.id)!+x.bandwidth()/2,35,c.name[this.locale],'label','middle').style('font-size',w<450?'9px':'12px'));
   dataset.cases.forEach(c=>{
    this.label(svg,left-10,y(c.id)!+y.bandwidth()/2+4,c.name[this.locale],'label','end').style('font-size','11px');
    dataset.capabilities.forEach(cap=>{
     const related=c.capabilities.includes(cap.id);
     const g=svg.append('g').attr('tabindex',0).attr('role','button').attr('aria-label',`${c.name[this.locale]} / ${cap.name[this.locale]}: ${related?this.t('有应用关系','application shown'):this.t('未收录关系','not documented')}`).on('click',()=>this.selectIndustry(c.id)).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectIndustry(c.id);}});
     g.append('rect').attr('x',x(cap.id)!).attr('y',y(c.id)!).attr('width',x.bandwidth()).attr('height',y.bandwidth()).attr('rx',5).attr('fill',related?'var(--hw-mint)':'var(--surface-muted)').attr('opacity',related?(c.id===selected?1:.5):1).attr('stroke',c.id===selected?'var(--hw-blue)':'var(--border-soft)');
     if(related)g.append('circle').attr('cx',x(cap.id)!+x.bandwidth()/2).attr('cy',y(c.id)!+y.bandwidth()/2).attr('r',3).attr('fill','var(--surface)');
    });
   });
  }else{
   const nodeWidth=Math.min(180,w*.39),left=nodeWidth/2+4,right=w-nodeWidth/2-4;
   const nodes=[...dataset.cases.map((c,i)=>({id:c.id,label:c.name[this.locale],group:0,x:left,y:65+i*74})),...dataset.capabilities.map((c,i)=>({id:c.id,label:c.name[this.locale],group:1,x:right,y:102+i*74}))];
   const links=dataset.cases.flatMap(c=>c.capabilities.map(cap=>({source:nodes.find(n=>n.id===c.id)!,target:nodes.find(n=>n.id===cap)!})));
   const layer=svg.append('g');
   this.label(svg,left,22,this.t('产业场景','INDUSTRIES'),'label','middle');
   this.label(svg,right,22,this.t('智能能力','CAPABILITIES'),'label','middle');
   layer.selectAll('path').data(links).join('path').attr('d',d=>`M${d.source.x+nodeWidth/2},${d.source.y} C${w/2},${d.source.y} ${w/2},${d.target.y} ${d.target.x-nodeWidth/2},${d.target.y}`).attr('fill','none').attr('stroke',d=>d.source.id===selected?'var(--hw-blue)':'var(--border-strong)').attr('stroke-width',d=>d.source.id===selected?3:1.5).attr('opacity',d=>d.source.id===selected?1:.45);
   const connected=dataset.cases.find(c=>c.id===selected)!.capabilities;
   const node=layer.selectAll('g.node').data(nodes).join('g').attr('class','node').attr('transform',d=>`translate(${d.x},${d.y})`).attr('role','button').attr('tabindex',0).attr('aria-label',d=>d.label).attr('aria-pressed',d=>String(d.id===selected)).attr('opacity',d=>d.id===selected||connected.includes(d.id)?1:.7);
   node.append('rect').attr('x',-nodeWidth/2).attr('y',-25).attr('width',nodeWidth).attr('height',50).attr('rx',12).attr('fill',d=>d.id===selected?'var(--hw-blue)':'var(--surface)').attr('stroke',d=>palette[d.group]).attr('stroke-width',1.6);
   node.append('text').attr('text-anchor','middle').attr('dy',4).attr('font-size',w<400?10:13).attr('fill',d=>d.id===selected?(document.documentElement.classList.contains('dark')?'#172039':'#fff'):palette[d.group]).text(d=>d.label);
   node.on('click',(_,d)=>{if(d.group===0)this.selectIndustry(d.id);else{const c=dataset.cases.find(c=>c.capabilities.includes(d.id));if(c)this.selectIndustry(c.id);}}).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(d.group===0)this.selectIndustry(d.id);else{const c=dataset.cases.find(c=>c.capabilities.includes(d.id));if(c)this.selectIndustry(c.id);}}});
  }
  const c=dataset.cases.find(c=>c.id===selected)!;
  this.status(`${c.name[this.locale]} · ${c.task[this.locale]} — ${this.t('案例与来源已联动更新。布局距离不代表相似度。','Linked case and source updated. Layout distance is not a similarity metric.')}`);
 }
 private effects(){
  const {svg,w}=this.svg(240),key=this.value('effect')||'support';
  const r=dataset.records.find(r=>r.id===key)!,x=d3.scaleLinear().domain([0,140]).range([40,w-35]);
  svg.append('g').attr('transform','translate(0,185)').call(d3.axisBottom(x).ticks(w<450?4:7));
  svg.append('line').attr('x1',x(100)).attr('x2',x(100)).attr('y1',65).attr('y2',180).attr('stroke','var(--border-strong)').attr('stroke-dasharray','4 5');
  svg.append('line').attr('x1',x(100)).attr('x2',x(100)).attr('y1',115).attr('y2',115).attr('stroke','var(--hw-mint)').attr('stroke-width',5).transition().duration(this.duration()).attr('x2',x(100+r.value));
  svg.append('circle').attr('cx',x(100)).attr('cy',115).attr('r',8).attr('fill','var(--surface)').attr('stroke','var(--text-subtle)').attr('stroke-width',2);
  svg.append('circle').attr('cx',x(100)).attr('cy',115).attr('r',8).attr('fill','var(--hw-mint)').transition().duration(this.duration()).attr('cx',x(100+r.value));
  this.label(svg,x(100),155,`${this.t('基准','Base')} 100`,'label','middle');
  this.label(svg,x(100+r.value),82,`${this.t('AI','AI')} ${100+r.value}`,'value-label','middle');
  this.label(svg,40,28,r.label[this.locale],'label');
  this.status(`${r.value>0?'+':''}${r.value}% · ${key==='time'?this.t('完成时间减少，数值更低表示更快。','Less completion time: lower means faster.'):this.t('相同指标下，数值更高表示改善。','A higher value indicates improvement on this outcome.')} ${this.t('基准指数是换算值，不是原始测量单位。','The baseline index is derived, not the original measurement unit.')}`);
 }
 private skills(){
  const {svg,w}=this.svg(250),rows=dataset.records.filter(r=>['support','novice'].includes(r.id));
  const x=d3.scaleLinear().domain([0,40]).range([20,w-40]);
  rows.forEach((r,i)=>{
   const y=55+i*90;
   this.label(svg,20,y-18,i===0?this.t('总体样本','Overall sample'):this.t('新手与低技能组（子集）','Novice / low-skilled subset'));
   svg.append('rect').attr('x',20).attr('y',y).attr('height',23).attr('width',0).attr('rx',4).attr('fill',palette[i]).transition().duration(this.duration()).attr('width',x(r.value)-20);
   this.label(svg,x(r.value)+8,y+17,`+${r.value}%`,'value-label').style('font-size','12px');
  });
  svg.append('g').attr('transform','translate(0,208)').call(d3.axisBottom(x).ticks(4).tickFormat(v=>`${v}%`));
 }
 private params(){
  const lab=this.closest('hw02-shell')?.querySelector('ai-viz[data-kind=lab]');
  return Object.fromEntries(Object.keys(defaults).map(k=>[k,lab?.querySelector<HTMLInputElement>(`[data-control="${k}"]`)?.value??fromUrl(k,String(defaults[k as keyof typeof defaults]))]));
 }
 private updatePlayButton(){const b=this.querySelector('[data-action=play]');if(b)b.textContent=this.playing?this.t('暂停','Pause'):this.t('播放流程','Play workflow');}
 private lab(){
  const input=Object.fromEntries(Object.keys(defaults).map(key=>[key,this.value(key)]));const result=calculate(input);
  for(const [key,value]of Object.entries(result.params)){const o=this.querySelector(`[data-output="${key}"]`);if(o)o.textContent=String(value);}
  this.q('[data-result=baseline]').textContent=`${(result.baseTotal/60).toFixed(1)} ${this.t('小时','h')}`;
  this.q('[data-result=assisted]').textContent=`${(result.aiTotal/60).toFixed(1)} ${this.t('小时','h')}`;
  this.q('[data-result=saved]').textContent=`${result.saved.toFixed(1)}%`;
  const {svg,w}=this.svg(310),left=18,right=w-20;
  const total=Math.max(result.baseTotal,result.aiTotal),x=d3.scaleLinear().domain([0,total]).range([left,right]);
  const labels=[this.t('需求','Brief'),this.t('生产','Produce'),this.t('复核','Review'),this.t('交付','Deliver')];
  const rows=[result.baseline,result.assisted],trackY=[72,185];
  rows.forEach((values,row)=>{
   this.label(svg,left,trackY[row]-20,row===0?this.t('原流程','BASELINE'):this.t('AI 协作','AI-ASSISTED'));
   let start=0;
   values.forEach((value,i)=>{
    const x0=x(start),width=x(start+value)-x(start);start+=value;
    svg.append('rect').attr('x',x0).attr('y',trackY[row]).attr('width',Math.max(0,width-2)).attr('height',35).attr('rx',4).attr('fill',palette[i]).attr('opacity',row===0?.3:.65);
    if(width>42)this.label(svg,x0+width/2,trackY[row]+22,labels[i],'label','middle').style('font-size','10px').style('fill','var(--text-primary)');
    this.label(svg,x0+width/2,trackY[row]+54,`${(value/60).toFixed(1)}h`,'label','middle').style('font-size','9px');
   });
  });
  const hours=d3.scaleLinear().domain([0,total/60]).range([left,right]);
  svg.append('g').attr('transform','translate(0,277)').call(d3.axisBottom(hours).ticks(w<450?4:8).tickFormat(v=>`${v}h`));
  const dots=svg.selectAll('circle.task').data([0,1]).join('circle').attr('class','task').attr('cy',d=>trackY[d]+17).attr('r',6).attr('fill','var(--surface)').attr('stroke','var(--text-primary)').attr('stroke-width',2);
  const marker=svg.append('line').attr('y1',40).attr('y2',249).attr('stroke','var(--text-subtle)').attr('stroke-dasharray','3 5');
  const draw=(elapsed:number)=>{
   const time=Math.min(total,elapsed/12000*total);
   dots.attr('cx',d=>x(Math.min(time,d===0?result.baseTotal:result.aiTotal)));
   marker.attr('x1',x(time)).attr('x2',x(time));
  };
  draw(this.elapsed);
  if(this.playing&&this.motion()){
   if(this.elapsed>=12000)this.elapsed=0;
   const initial=this.elapsed,speed=Number(this.value('playback'))||1;
   this.timer=d3.timer(ms=>{this.elapsed=Math.min(12000,initial+ms*speed);draw(this.elapsed);if(this.elapsed>=12000){this.timer?.stop();this.playing=false;this.updatePlayButton();}});
  }else if(this.playing){this.elapsed=12000;draw(this.elapsed);this.playing=false;}
  this.updatePlayButton();
  const maxIdx=result.assisted.indexOf(Math.max(...result.assisted));
  this.status(`${this.t('当前耗时最多的阶段','Largest effort stage')}: ${labels[maxIdx]}。 ${result.saved>=0?this.t('节省','Saves'):this.t('增加','Adds')} ${Math.abs((result.baseTotal-result.aiTotal)/60).toFixed(1)} ${this.t('小时。圆点表示同一批任务在串行总工时中的进度；整段约 12 秒，支持变速播放。','hours. Dots show progress through serial effort for the same batch; playback takes about 12 seconds at 1×.')}`);
 }
 private sensitivity(){
  const p=this.params(),result=calculate(p),{svg,w}=this.svg(280),left=48,bottom=225;
  const points=d3.range(0,101,5).map(a=>({a,h:calculate({...p,adoption:a}).aiTotal/60}));
  const x=d3.scaleLinear().domain([0,100]).range([left,w-22]);const y=d3.scaleLinear().domain([0,Math.max(result.baseTotal/60,d3.max(points,d=>d.h)!)*1.15]).nice().range([bottom,25]);
  svg.append('g').attr('class','grid').attr('transform',`translate(${left},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(w-left-22)).tickFormat(()=>''));
  svg.append('g').attr('transform',`translate(0,${bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat(v=>`${v}%`));
  svg.append('g').attr('transform',`translate(${left},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(v=>`${v}h`));
  svg.append('line').attr('x1',left).attr('x2',w-22).attr('y1',y(result.baseTotal/60)).attr('y2',y(result.baseTotal/60)).attr('stroke','var(--text-subtle)').attr('stroke-dasharray','5 5');
  svg.append('path').datum(points).attr('d',d3.line<typeof points[number]>().x(d=>x(d.a)).y(d=>y(d.h))).attr('fill','none').attr('stroke','var(--hw-blue)').attr('stroke-width',2.5);
  svg.append('circle').attr('cx',x(result.params.adoption)).attr('cy',y(result.aiTotal/60)).attr('r',6).attr('fill','var(--hw-blue)').append('title').text(`${result.params.adoption}%: ${(result.aiTotal/60).toFixed(1)}h`);
  const benefit=30*(1-1/result.params.speed);const threshold=benefit===0?Infinity:100*result.params.review/benefit;
  this.status(threshold>100?this.t('在当前加速与复核条件下，提高参与比例也无法获得正的净工时节省。','At these speed and review settings, participation cannot produce positive net savings.'):this.t(`参与比例超过 ${threshold.toFixed(1)}% 时，模型才产生净工时节省。`,`The model produces net effort savings above ${threshold.toFixed(1)}% participation.`));
 }
 private energy(){
  const {svg,w}=this.svg(285),indexed=this.value('energy')==='index';
  const rows=dataset.records.filter(r=>r.id.startsWith('energy-')).map(r=>({...r,plot:indexed?r.value/415*100:r.value}));
  const x=d3.scaleBand().domain(rows.map(r=>String(r.period))).range([55,w-25]).padding(.5);
  const y=d3.scaleLinear().domain([0,indexed?260:1100]).range([220,28]);
  svg.append('g').attr('class','grid').attr('transform','translate(55,0)').call(d3.axisLeft(y).ticks(4).tickSize(-(w-80)).tickFormat(()=>''));
  svg.append('g').attr('transform','translate(55,0)').call(d3.axisLeft(y).ticks(4));
  rows.forEach((r,i)=>{
   const rect=svg.append('rect').attr('x',x(String(r.period))!).attr('width',x.bandwidth()).attr('y',220).attr('height',0).attr('rx',4).attr('fill',palette[i===0?0:3]).attr('fill-opacity',i===0?.75:.16).attr('stroke',palette[i===0?0:3]).attr('stroke-dasharray',i===0?null:'5 4');
   rect.transition().duration(this.duration()).attr('y',y(r.plot)).attr('height',220-y(r.plot));
   this.label(svg,x(String(r.period))!+x.bandwidth()/2,y(r.plot)-12,indexed?r.plot.toFixed(1):String(r.value),'value-label','middle');
   this.label(svg,x(String(r.period))!+x.bandwidth()/2,242,String(r.period),'label','middle');
   this.label(svg,x(String(r.period))!+x.bandwidth()/2,262,r.label[this.locale],'label','middle').style('font-size','10px');
  });
  this.status(this.t('实心柱：历史估计。虚线柱：未来情景。两者之间不补画未报告的年度数值。','Solid: historical estimate. Dashed: future scenario. No unreported annual values are interpolated.'));
 }
 private sources(){
  const query=this.value('search').trim().toLocaleLowerCase();let count=0;
  this.querySelectorAll<HTMLElement>('[data-source-row]').forEach(row=>{row.hidden=!((row.textContent??'')+' '+(row.querySelector('a')?.href??'')).toLocaleLowerCase().includes(query);if(!row.hidden)count++;});
  this.q('[data-count]').textContent=this.t(`${count} 个来源`,`${count} sources`);
  this.status(count?'':this.t('没有匹配的来源，请换一个关键词。','No matching sources. Try another term.'));
 }
}
if(!customElements.get('ai-viz'))customElements.define('ai-viz',AiViz);
