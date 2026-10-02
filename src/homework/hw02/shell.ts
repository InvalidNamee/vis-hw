class HwShell extends HTMLElement {
 private stop?:AbortController;
 connectedCallback(){
  this.stop=new AbortController(); const opts={signal:this.stop.signal};
  const mobile=this.querySelector<HTMLButtonElement>('.hw-mobile-menu')!;
  const side=this.querySelector<HTMLElement>('.hw-sidebar')!;
  const collapse=this.querySelector<HTMLButtonElement>('.hw-collapse')!;
  const mq=matchMedia('(max-width: 900px)');
  const close=()=>{this.removeAttribute('data-open');mobile.setAttribute('aria-expanded','false');};
  mobile.addEventListener('click',()=>{const open=this.toggleAttribute('data-open');mobile.setAttribute('aria-expanded',String(open));if(open) side.querySelector<HTMLAnchorElement>('nav a')?.focus();},opts);
  collapse.addEventListener('click',()=>{
   if(mq.matches){close();mobile.focus();return;}
   const collapsed=this.toggleAttribute('data-collapsed');collapse.setAttribute('aria-expanded',String(!collapsed));
   collapse.setAttribute('aria-label',this.dataset.lang==='en'?(collapsed?'Expand sidebar':'Collapse sidebar'):(collapsed?'展开侧栏':'折叠侧栏'));
   try{sessionStorage.setItem('hw02-sidebar',String(collapsed));}catch{}
  },opts);
  try{if(sessionStorage.getItem('hw02-sidebar')==='true'){this.setAttribute('data-collapsed','');collapse.setAttribute('aria-expanded','false');collapse.setAttribute('aria-label',this.dataset.lang==='en'?'Expand sidebar':'展开侧栏');}}catch{}
  this.addEventListener('keydown',(e)=>{
   if(!this.hasAttribute('data-open')||!mq.matches)return;
   if(e.key==='Escape'){close();mobile.focus();}
   if(e.key==='Tab'){
    const items=Array.from(side.querySelectorAll<HTMLElement>('a,button'));const first=items[0],last=items.at(-1)!;
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  },opts);
  this.addEventListener('click',e=>{if(this.hasAttribute('data-open')&&!side.contains(e.target as Node)&&!mobile.contains(e.target as Node))close();},opts);
  mq.addEventListener('change',close,opts);
 }
 disconnectedCallback(){this.stop?.abort();}
}
if(!customElements.get('hw02-shell'))customElements.define('hw02-shell',HwShell);
