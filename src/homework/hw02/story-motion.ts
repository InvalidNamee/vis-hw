import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Decorative motion only: native anchors and the D3 scene controller own reading. */
class StoryExperience extends HTMLElement {
 private context?:ReturnType<typeof gsap.context>;
 private abort?:AbortController;
 private resize?:ResizeObserver;
 private frame=0;
 private refreshTimer=0;
 connectedCallback(){this.frame=requestAnimationFrame(()=>this.mount());}
 disconnectedCallback(){
  cancelAnimationFrame(this.frame);clearTimeout(this.refreshTimer);
  this.resize?.disconnect();this.abort?.abort();this.context?.revert();
 }
 private mount(){
  if(!this.isConnected)return;
  this.abort=new AbortController();
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const setup=()=>{this.context=gsap.context(()=>{
   gsap.to(this.querySelector('.story-scroll-progress span'),{scaleX:1,ease:'none',scrollTrigger:{trigger:this,start:'top top',end:'bottom bottom',scrub:true}});
   const cover=this.querySelector('.story-cover')!;
   gsap.fromTo(cover.querySelector('img'),{scale:1.08,yPercent:0},{scale:1.18,yPercent:12,ease:'none',scrollTrigger:{trigger:cover,start:'top top',end:'bottom top',scrub:.6}});
   gsap.to(cover.querySelector('.story-cover-orbits'),{rotation:32,y:60,ease:'none',scrollTrigger:{trigger:cover,start:'top top',end:'bottom top',scrub:.8}});
   this.querySelectorAll('.story-chapter-heading').forEach(heading=>{
    gsap.fromTo(heading.querySelector('img'),{yPercent:-8,scale:1.18},{yPercent:8,scale:1.18,ease:'none',scrollTrigger:{trigger:heading,start:'top bottom',end:'bottom top',scrub:.6}});
    gsap.from(heading.querySelector('div'),{y:24,duration:.8,ease:'power2.out',scrollTrigger:{trigger:heading,start:'top 85%',toggleActions:'play none none reverse'}});
   });
   this.querySelectorAll('.story-step-copy').forEach(copy=>{
    // Keep text visible throughout; movement never changes the anchor geometry.
    gsap.from(copy,{x:-12,duration:.6,ease:'power2.out',scrollTrigger:{trigger:copy,start:'top 90%',toggleActions:'play none none reverse'}});
   });
  },this);};
  if(!motion.matches)setup();
  motion.addEventListener('change',()=>{
   // ScrollTrigger reversion can restore an old scroll position. Preserve the
   // reader's current position when accessibility settings change mid-story.
   const position={left:scrollX,top:scrollY,behavior:'instant' as ScrollBehavior};
   this.context?.revert();this.context=undefined;
   if(!motion.matches)setup();
   window.scrollTo(position);ScrollTrigger.refresh();window.scrollTo(position);
  },{signal:this.abort.signal});
  // Lazy D3 drawing and an opened data table can alter document height.
  this.resize=new ResizeObserver(()=>{
   clearTimeout(this.refreshTimer);
   this.refreshTimer=window.setTimeout(()=>{if(this.isConnected)ScrollTrigger.refresh();},180);
  });this.resize.observe(this);
 }
}
if(!customElements.get('story-experience'))customElements.define('story-experience',StoryExperience);
