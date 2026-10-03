import * as d3 from 'd3';
import {findStoryStep,storyChapters} from './story-content';
import {drawStoryPlot,storyPlotHeight} from './story-plots';
import type {Lang} from './content';

class StoryChapter extends HTMLElement {
 private abort?:AbortController;
 private near?:IntersectionObserver;
 private stepsObserver?:IntersectionObserver;
 private resize?:ResizeObserver;
 private theme?:MutationObserver;
 private frame=0;
 private nearby=false;
  private fixed=false;
 private locale:Lang='zh';
 private width=0;
 private rejectedViewport='';
 private sceneSizeKey='';
 private expandedScene='';
 connectedCallback(){this.frame=requestAnimationFrame(()=>this.mount());}
 disconnectedCallback(){cancelAnimationFrame(this.frame);this.abort?.abort();this.near?.disconnect();this.stepsObserver?.disconnect();this.resize?.disconnect();this.theme?.disconnect();d3.select(this).selectAll('*').interrupt();}
 private mount(){
  if(!this.isConnected)return;
  this.locale=this.dataset.lang as Lang;this.abort=new AbortController();const opts={signal:this.abort.signal};
  this.reserveSnapshots();
  this.setAttribute('data-enhanced','');
  const schedule=()=>{cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>this.update());};
  this.near=new IntersectionObserver(entries=>{this.nearby=entries[0].isIntersecting;if(this.nearby)schedule();},{rootMargin:'400px 0px'});this.near.observe(this);
  this.stepsObserver=new IntersectionObserver(entries=>{if(!this.fixed)for(const entry of entries)if(entry.isIntersecting)this.draw(entry.target.querySelector<HTMLElement>('.story-scene')!);},{rootMargin:'250px 0px'});
  this.querySelectorAll('.story-step').forEach(step=>this.stepsObserver!.observe(step));
  this.resize=new ResizeObserver(()=>{const w=Math.round(this.clientWidth);if(w!==this.width){this.width=w;this.invalidate();schedule();}});this.resize.observe(this);
  this.theme=new MutationObserver(()=>{this.invalidate();schedule();});this.theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('scroll',()=>{if(this.nearby)schedule();}, {...opts,passive:true});
  window.addEventListener('resize',schedule,opts);
  window.addEventListener('hashchange',schedule,opts);
  matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',()=>{d3.select(this).selectAll('*').interrupt();this.invalidate();schedule();},opts);
  this.addEventListener('toggle',event=>{
   const details=event.target as HTMLDetailsElement;
   if(details.matches('.story-data')){
    const scene=details.closest<HTMLElement>('.story-scene')!;
    this.querySelectorAll<HTMLDetailsElement>(`[data-scene="${scene.dataset.scene}"] .story-data`).forEach(other=>{if(other!==details&&other.open!==details.open)other.open=details.open;});
    if(details.open&&details.closest('.story-sticky'))this.expandedScene=scene.dataset.scene!;
   }
   schedule();
  },{...opts,capture:true});
  this.update();
 }
 private invalidate(){this.sceneSizeKey='';this.rejectedViewport='';this.querySelectorAll<HTMLElement>('[data-story-canvas]').forEach(canvas=>delete canvas.dataset.renderKey);}
 private header(){return document.querySelector('.site-header')?.getBoundingClientRect().height??65;}
 private update(){
  if(!this.isConnected)return;
  const viewportKey=`${innerWidth}-${innerHeight}-${document.documentElement.dataset.theme}`;
  const viewportFits=innerWidth>=1100&&innerHeight>=740&&this.rejectedViewport!==viewportKey;
  this.fixed=viewportFits;this.toggleAttribute('data-fixed',this.fixed);
  const sticky=this.querySelector<HTMLElement>('.story-sticky')!;
  sticky.setAttribute('aria-hidden',String(!this.fixed));
  const steps=Array.from(this.querySelectorAll<HTMLElement>('.story-step'));
  const threshold=this.header()+(innerHeight-this.header())*.42;
  let index=0;steps.forEach((step,i)=>{if(step.getBoundingClientRect().top<=threshold)index=i;});
  const id=steps[index].dataset.storyStep!,changed=this.dataset.activeStep!==id;this.dataset.activeStep=id;
  steps.forEach(step=>step.toggleAttribute('data-active',step.dataset.storyStep===id));
  this.querySelectorAll<HTMLElement>('[data-progress-step]').forEach(dot=>dot.toggleAttribute('data-active',dot.dataset.progressStep===id));
  const panels=this.querySelectorAll<HTMLElement>('[data-master-step]');panels.forEach(panel=>panel.hidden=panel.dataset.masterStep!==id);
  if(this.nearby&&this.fixed){
   this.sizeScenes(viewportKey);
   const scene=this.querySelector<HTMLElement>(`[data-master-step="${id}"] .story-scene`)!;this.draw(scene);
   if(changed)this.revealScene(d3.select(scene.querySelector<HTMLElement>('[data-story-canvas]')!).select<SVGSVGElement>('svg'));
   if(sticky.getBoundingClientRect().height>innerHeight-this.header()-40){
    const top=scene.getBoundingClientRect().top,focused=sticky.contains(document.activeElement);
    this.rejectedViewport=viewportKey;this.fixed=false;this.removeAttribute('data-fixed');sticky.setAttribute('aria-hidden','true');
    if(this.expandedScene===id){
     const snapshot=steps[index].querySelector<HTMLElement>('.story-scene')!;
     if(focused)snapshot.querySelector<HTMLElement>('.story-data summary')?.focus({preventScroll:true});
     window.scrollTo({top:scrollY+snapshot.getBoundingClientRect().top-top,behavior:'instant'});
     this.expandedScene='';
    }
   }
  }
  if(!this.fixed)this.reserveSnapshots();
  if(!this.fixed)steps.forEach(step=>{const r=step.getBoundingClientRect();if(r.bottom>-250&&r.top<innerHeight+250)this.draw(step.querySelector<HTMLElement>('.story-scene')!);});
  this.updateReadingProgress();
 }
 private reserveSnapshots(){
  this.querySelectorAll<HTMLElement>('.story-snapshot .story-scene').forEach(scene=>{
   const style=getComputedStyle(scene),w=scene.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
   if(w>0)scene.style.setProperty('--story-plot-height',`${storyPlotHeight(findStoryStep(scene.dataset.scene!)!,Math.max(240,w))}px`);
  });
 }
 private sizeScenes(key:string){
  if(this.sceneSizeKey===key)return;
  this.sceneSizeKey=key;
  this.style.removeProperty('--story-scene-height');
  const master=this.querySelector<HTMLElement>('.story-master-scenes')!,width=master.clientWidth;
  let height=0;
  this.querySelectorAll<HTMLElement>('[data-master-step]').forEach(panel=>{
   const wasHidden=panel.hidden;panel.hidden=false;
   panel.style.cssText=`display:block;visibility:hidden;position:absolute;width:${width}px;pointer-events:none;`;
   const scene=panel.querySelector<HTMLElement>('.story-scene')!;
   this.draw(scene);height=Math.max(height,scene.getBoundingClientRect().height);
   panel.removeAttribute('style');panel.hidden=wasHidden;
  });
  this.style.setProperty('--story-scene-height',`${Math.ceil(height)}px`);
 }
 private draw(scene:HTMLElement){
  if(!scene||!scene.getBoundingClientRect().width)return;
  const step=findStoryStep(scene.dataset.scene!)!,canvas=scene.querySelector<HTMLElement>('[data-story-canvas]')!;
  const style=getComputedStyle(scene),w=Math.max(240,scene.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
  const theme=document.documentElement.dataset.theme||'light',key=`${Math.round(w)}-${theme}-${step.id}`;
  if(canvas.dataset.renderKey===key)return;
  d3.select(canvas).selectAll('*').interrupt();
  const svg=d3.select(canvas).selectAll<SVGSVGElement,null>('svg').data([null]).join('svg').attr('id',`plot-${scene.dataset.instance}`).attr('aria-label',step.label[this.locale]);svg.selectAll('*').remove();
  drawStoryPlot(svg,w,step,this.locale);
  canvas.dataset.drawn='';canvas.dataset.renderKey=key;
  this.revealScene(svg);
 }
 private revealScene<T,P extends d3.BaseType,PD>(svg:d3.Selection<SVGSVGElement,T,P,PD>){
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  svg.interrupt();
  svg.attr('opacity',reduced?1:.4);
  if(!reduced){svg.transition().duration(320).attr('opacity',1);if(svg.select('g.adoption-point').size())svg.selectAll('g.adoption-point').attr('opacity',0).transition().delay((_,i)=>i*140).duration(280).attr('opacity',1);}
 }
 private updateReadingProgress(){
  const chapters=Array.from(document.querySelectorAll<HTMLElement>('story-chapter'));
  const threshold=this.header()+(innerHeight-this.header())*.3;let chapter:HTMLElement|undefined;
  chapters.forEach(c=>{if(c.getBoundingClientRect().top<=threshold)chapter=c;});
  const current=chapter?.dataset.chapterId;
  document.querySelectorAll<HTMLAnchorElement>('[data-story-nav]').forEach(link=>{if(link.dataset.storyNav===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  const progress=document.querySelector('[data-story-reading]');
  if(progress){const index=storyChapters.findIndex(c=>c.id===current);progress.textContent=index<0?(this.locale==='en'?'Six chapters / start with a task':'六幕 / 从一个任务开始'):`${String(index+1).padStart(2,'0')} / 06 · ${storyChapters[index].name[this.locale]}`;}
 }
}
if(!customElements.get('story-chapter'))customElements.define('story-chapter',StoryChapter);

// Settle an explicit refresh anchor after enhancement and initial observers.
const initialAnchor=location.hash;
if(initialAnchor){
 const target=document.getElementById(decodeURIComponent(initialAnchor.slice(1)));
 if(target?.matches('story-chapter,.story-step')){
  const navigation=new AbortController();
  const cancel=()=>navigation.abort();
  for(const event of ['wheel','touchstart','keydown','hashchange'])window.addEventListener(event,cancel,{signal:navigation.signal,once:true,passive:true});
  let frames=0,stable=0,lastHeight=0;
  const settle=()=>{
   if(navigation.signal.aborted||location.hash!==initialAnchor||!target.isConnected){cancel();return;}
   const height=document.documentElement.scrollHeight;
   stable=height===lastHeight?stable+1:0;lastHeight=height;
   target.scrollIntoView({behavior:'instant',block:'start'});
   if(++frames<30&&(frames<8||stable<3))requestAnimationFrame(settle);else cancel();
  };
  requestAnimationFrame(settle);
 }
}
