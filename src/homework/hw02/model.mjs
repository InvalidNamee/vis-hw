/** Transparent, serial-effort teaching model. Units: minutes per task. */
export const defaults = Object.freeze({ tasks:20, adoption:60, speed:3, review:4 });
export const presets=Object.freeze({
 'low-review':Object.freeze({tasks:20,adoption:80,speed:3,review:1}),
 'high-review':Object.freeze({tasks:20,adoption:80,speed:3,review:20}),
 'low-adoption':Object.freeze({tasks:20,adoption:15,speed:3,review:4}),
});
export const limits = Object.freeze({ tasks:[1,100], adoption:[0,100], speed:[1,8], review:[0,30] });
export function normalize(input = {}) {
  return Object.fromEntries(Object.entries(defaults).map(([key,fallback])=>{
    const raw=input[key];
    const value=raw===undefined||raw===null||raw===''?fallback:Number(raw);
    const [min,max]=limits[key];
    const bounded=Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
    return [key,key==='tasks'?Math.round(bounded):bounded];
  }));
}
export function calculate(input = {}) {
  const p=normalize(input), a=p.adoption/100;
  const baseline=[10,30,10,5].map(v=>v*p.tasks);
  const assisted=[10,30*(1-a+a/p.speed),10+p.review,5].map(v=>v*p.tasks);
  const total=values=>values.reduce((a,b)=>a+b,0);
  const baseTotal=total(baseline), aiTotal=total(assisted);
  return {params:p,baseline,assisted,baseTotal,aiTotal,saved:100*(baseTotal-aiTotal)/baseTotal};
}
