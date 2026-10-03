import * as d3 from 'd3';
import {findStoryStep,storyChapters} from './story-content';
import {drawExplorable,explorableHeight} from './story-graphics';
import {sceneState} from './story-state';
import {renderSceneControls} from './story-interactions';
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
 private sceneOpen=new Map<string,boolean>();
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
  this.addEventListener('story:change',()=>{this.sceneSizeKey='';schedule();},opts);
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
  const id=steps[index].dataset.storyStep!;this.dataset.activeStep=id;
  steps.forEach(step=>step.toggleAttribute('data-active',step.dataset.storyStep===id));
  this.querySelectorAll<HTMLElement>('[data-progress-step]').forEach(dot=>dot.toggleAttribute('data-active',dot.dataset.progressStep===id));
  if(this.nearby&&this.fixed){
   this.sizeScenes(viewportKey);
   const scene=this.querySelector<HTMLElement>('.story-master-scenes .story-scene')!;
   if(scene.dataset.scene!==id)this.syncScene(scene,steps[index].querySelector<HTMLElement>('.story-scene')!);
   this.draw(scene);
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
   if(w>0)scene.style.setProperty('--story-plot-height',`${explorableHeight(findStoryStep(scene.dataset.scene!)!,Math.max(240,w))}px`);
  });
 }
 private syncScene(master:HTMLElement,snapshot:HTMLElement){
  const previous=master.querySelector<HTMLDetailsElement>('.story-data');
  if(previous)this.sceneOpen.set(master.dataset.scene!,previous.open);
  const canvas=master.querySelector<HTMLElement>('[data-story-canvas]')!,controls=master.querySelector<HTMLElement>('.story-interaction')!;
  const restoreFocus=master.contains(document.activeElement);
  master.replaceChildren(...Array.from(snapshot.children).filter(child=>!child.matches('[data-story-canvas],.story-interaction')).map(child=>child.cloneNode(true)));
  master.querySelector('figcaption')!.after(canvas);
  master.querySelector('.story-fallback')!.after(controls);
  master.dataset.scene=snapshot.dataset.scene;
  const details=master.querySelector<HTMLDetailsElement>('.story-data');
  if(details)details.open=this.sceneOpen.get(master.dataset.scene!)??false;
  if(restoreFocus){controls.tabIndex=-1;controls.focus({preventScroll:true});}
 }
 private sizeScenes(key:string){
  if(this.sceneSizeKey===key)return;
  this.sceneSizeKey=key;this.style.removeProperty('--story-scene-height');
  const master=this.querySelector<HTMLElement>('.story-master-scenes')!,width=master.clientWidth;
  let height=0;
  // Measure lightweight copies, not alternate live SVGs. The real graph never resets.
  this.querySelectorAll<HTMLElement>('.story-snapshot .story-scene').forEach(snapshot=>{
   const scene=snapshot.cloneNode(true) as HTMLElement;
   scene.style.cssText=`visibility:hidden;position:absolute;width:${width}px;pointer-events:none;`;
   master.append(scene);
   const step=findStoryStep(scene.dataset.scene!)!,style=getComputedStyle(scene),w=Math.max(240,width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
   const canvas=scene.querySelector<HTMLElement>('[data-story-canvas]')!;canvas.dataset.drawn='';
   canvas.replaceChildren();canvas.style.height=`${explorableHeight(step,w)}px`;canvas.style.flex='none';
   renderSceneControls(scene.querySelector<HTMLElement>('.story-interaction')!,step,this.locale);
   height=Math.max(height,scene.getBoundingClientRect().height);scene.remove();
  });
  this.style.setProperty('--story-scene-height',`${Math.ceil(height)}px`);
 }
 private draw(scene:HTMLElement,animate=true){
  if(!scene||!scene.getBoundingClientRect().width)return;
  const step=findStoryStep(scene.dataset.scene!)!,canvas=scene.querySelector<HTMLElement>('[data-story-canvas]')!;
  const style=getComputedStyle(scene),w=Math.max(240,scene.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
  const state=sceneState(step),theme=document.documentElement.dataset.theme||'light',key=`${Math.round(w)}-${theme}-${step.id}-${JSON.stringify(state)}`;
  renderSceneControls(scene.querySelector<HTMLElement>('.story-interaction')!,step,this.locale);
  if(canvas.dataset.renderKey===key)return;
  const svg=d3.select(canvas).selectAll<SVGSVGElement,null>('svg').data([null]).join('svg').attr('id',`plot-${scene.dataset.instance}`).attr('aria-label',step.label[this.locale]);
  svg.selectAll('*').interrupt();
  drawExplorable(svg,w,step,this.locale,state,animate);
  canvas.dataset.drawn='';canvas.dataset.renderKey=key;
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
