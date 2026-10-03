import * as d3 from 'd3';
import {drawExplanation} from './graphs';
import {drawScience} from './science-graphs';
import {drawEvidence} from './evidence-charts';
import {drawOutcome,drawAdoption,drawEnergy,type Plot} from './quantitative-charts';
import {drawIndustryNetwork} from './industry-network';
import {calculate} from './model.mjs';
import {storyLabParams,type StoryStep} from './story-content';
import type {Lang} from './content';
export function storyPlotHeight(step:StoryStep,w:number){
 if(step.scene==='collaboration'||step.scene==='infrastructure')return w<600?340:250;
 if(step.scene==='industry')return 420;
 if(step.scene==='discovery')return w<560?340:220;
 if(step.scene==='effects')return 225;
 if(step.scene==='adoption')return 265;
 if(step.scene==='energy')return 280;
 if(step.scene==='lab')return 380;
 return step.scene==='medical'?310:step.scene==='developers'?340:285;
}
export function drawStoryPlot(svg:Plot,w:number,step:StoryStep,lang:Lang){
 const height=storyPlotHeight(step,w);
 if(step.scene==='collaboration'||step.scene==='infrastructure'){
  drawExplanation(svg,w,step.scene,lang,()=>{},{focus:step.focus,interactive:false});
 }else if(step.scene==='industry'){
  drawIndustryNetwork(svg,w,lang,step.industry!);
 }else if(step.scene==='discovery'){
  drawScience(svg,w,'discovery',lang,()=>{},{focus:step.focus,interactive:false});
 }else if(step.scene==='effects'){
  drawOutcome(svg,w,step.outcome!,lang);
 }else if(step.scene==='adoption'){
  drawAdoption(svg,w,step.years);
 }else if(step.scene==='energy'){
  drawEnergy(svg,w,lang);
 }else if(step.scene==='lab'){
  drawLab(svg,w,step,lang);
 }else{
  drawEvidence(svg,w,step.scene,lang);
 }
 svg.attr('viewBox',`0 0 ${w} ${height}`).attr('role','img');
 return height;
}
function drawLab(svg:Plot,w:number,step:StoryStep,lang:Lang){
 const en=lang==='en',result=calculate(storyLabParams(step.lab)),colors=['var(--hw-blue)','var(--hw-mint)','var(--hw-purple)','var(--hw-orange)'];
 const names=en?['Brief','Produce','Review','Deliver']:['需求','生产','复核','交付'];
 const x=d3.scaleLinear().domain([0,Math.max(result.aiTotal,result.baseTotal)]).range([20,w-22]);
 const label=(x:number,y:number,value:string,anchor='start')=>svg.append('text').attr('x',x).attr('y',y).attr('text-anchor',anchor).attr('fill','var(--text-secondary)').attr('font-size',11).text(value);
 [result.baseline,result.assisted].forEach((values,row)=>{
  const y=45+row*110;label(20,y-17,row?(en?'SCENARIO':'当前情景'):(en?'BASELINE':'原流程'));
  let start=0;
  values.forEach((value,i)=>{
   const left=x(start),right=x(start+value),width=right-left-2;
   svg.append('rect').attr('x',left).attr('y',y).attr('width',Math.max(1,width)).attr('height',36).attr('rx',4).attr('fill',colors[i]).attr('fill-opacity',row?.62:.3);
   if(width>38)label((left+right)/2,y+22,names[i],'middle').attr('font-size',w<400?9:11).attr('fill','var(--text-primary)');
   label((left+right)/2,y+55,`${(value/60).toFixed(1)}h`,'middle').attr('font-size',10);start+=value;
  });
 });
 svg.append('g').attr('transform','translate(0,240)').call(d3.axisBottom(x).ticks(w<400?3:5).tickFormat(v=>`${(Number(v)/60).toFixed(0)}h`));
 label(20,287,`${en?'Total':'总工时'}: ${(result.baseTotal/60).toFixed(1)}h → ${(result.aiTotal/60).toFixed(1)}h`);
 names.forEach((name,i)=>{const left=20+(i%2)*(w-40)/2,y=348+Math.floor(i/2)*24;svg.append('circle').attr('cx',left+4).attr('cy',y-4).attr('r',4).attr('fill',colors[i]);label(left+15,y,name).attr('font-size',11);});
 label(20,316,`${en?'Effort saved':'节省工时'}: ${result.saved.toFixed(1)}%`).attr('font-size',16).attr('font-weight',600).attr('fill',result.saved<0?'var(--hw-orange)':'var(--hw-mint)');
}
