import type {StoryStep} from './story-content';
import {sceneState,patchScene} from './story-state';
import {calculate} from './model.mjs';
import {recordById,formatRecord,dataset,type Lang} from './content';

export function renderSceneControls(root:HTMLElement,step:StoryStep,lang:Lang){
 const en=lang==='en',t=(zh:string,english:string)=>en?english:zh;
 const signature=`${step.id}-${lang}`;
 const change=(patch:Parameters<typeof patchScene>[1])=>{
  patchScene(step,patch);sync();root.dispatchEvent(new CustomEvent('story:change',{bubbles:true,detail:{id:step.id}}));
 };
 const group=(label:string,choices:[string,string][],key:'phase'|'industry'|'year'|'firm'|'compare'|'reviewed')=>{
  const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=label;field.append(legend);
  const buttons=document.createElement('div');buttons.className='story-choice-buttons';field.append(buttons);
  choices.forEach(([value,text])=>{const button=document.createElement('button');button.type='button';button.textContent=text;button.dataset.sceneChoice=key;button.dataset.value=value;button.addEventListener('click',()=>change({[key]:key==='phase'||key==='year'?Number(value):key==='compare'||key==='reviewed'?value==='true':value}));buttons.append(button);});root.append(field);
 };
 const slider=(label:string,key:'adoption'|'speed'|'review',min:number,max:number,increment:number,unit:string)=>{
  const wrap=document.createElement('label');wrap.className='story-inline-slider';wrap.append(document.createTextNode(label));
  const output=document.createElement('output');output.dataset.sceneOutput=key;output.dataset.unit=unit;wrap.append(output);
  const input=document.createElement('input');input.type='range';input.min=String(min);input.max=String(max);input.step=key==='review'?'any':String(increment);input.dataset.sceneControl=key;input.setAttribute('data-hw02-control','');input.setAttribute('aria-label',label);input.addEventListener('input',()=>change({[key]:Number(input.value)}));wrap.append(input);root.append(wrap);
 };
 if(root.dataset.controlsKey!==signature){
  root.replaceChildren();root.dataset.controlsKey=signature;
  if(step.scene==='collaboration')group(step.focus===0?t('先补齐任务的信息','First add the task context'):t('试着检查一份 AI 草稿','Inspect an AI draft'),[['false',step.focus===0?t('信息不足','Missing context'):t('查看草稿','See draft')],['true',t('补上必要条件','Add the missing condition')]],'reviewed');
  if(step.scene==='industry'||step.scene==='discovery')group(t('同一种能力，用在哪里？','Where does the capability go?'),[['manufacturing',t('制造','Manufacturing')],['health',t('医疗','Healthcare')],['science',t('科研','Science')]],'industry');
  if(step.scene==='effects')group(t('怎样判断改善？','What counts as improvement?'),[['false',t('只看时间','Time only')],['true',t('也看质量','Include quality')]],'compare');
  if(step.scene==='adoption')group(t('比较调查年份','Compare survey years'),[['2023','2023'],['2024','2024'],['2025','2025']],'year');
  if(step.scene==='enterprise')group(t('比较企业规模','Compare firm sizes'),[['eu-small',t('小型','Small')],['eu-medium',t('中型','Medium')],['eu-large',t('大型','Large')]],'firm');
  if(step.scene==='lab'){
   slider(t('AI 参与率','AI participation'),'adoption',0,100,5,'%');
   slider(t('生产加速','Production speed'),'speed',1,8,.5,'×');
   slider(t('额外复核 / 任务','Extra review / task'),'review',0,30,1,t(' 分钟',' min'));
   const button=document.createElement('button');button.type='button';button.className='story-threshold-button';button.textContent=t('找到刚好不省时的点','Find the break-even point');button.addEventListener('click',()=>{const s=sceneState(step);change({review:30*s.adoption/100*(1-1/s.speed)});});root.append(button);
  }
  const status=document.createElement('p');status.className='story-interaction-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
 }
 function sync(){
  const s=sceneState(step);
  const scene=root.closest<HTMLElement>('.story-scene')!,heading=scene.querySelector('figcaption strong')!;
  if(step.scene==='industry'||step.scene==='discovery')heading.textContent=`${dataset.cases.find(c=>c.id===s.industry)!.name[lang]} · ${t('能力 → 任务 → 验证','capability → task → validation')}`;
  if(step.scene==='lab'){
   heading.textContent=`${t('教学实验','Teaching experiment')} · 20${t('项',' tasks')} / ${s.adoption}% / ${s.speed}× / ${s.review.toFixed(1)}${t('分钟额外复核',' min extra review')}`;
   const result=calculate({tasks:20,adoption:s.adoption,speed:s.speed,review:s.review});
   const facts=scene.querySelectorAll('.story-model-fallback strong');
   [result.baseTotal/60,result.aiTotal/60,result.saved].forEach((v,i)=>{if(facts[i])facts[i].textContent=v.toFixed(1)+(i===2?'%':en?' h':' 小时');});
   const link=scene.closest('story-chapter')?.querySelector<HTMLAnchorElement>(`#${step.id} .story-more`);
   if(link){const url=new URL(link.href);url.search=new URLSearchParams({tasks:'20',adoption:String(s.adoption),speed:String(s.speed),review:String(s.review)}).toString();link.href=url.href;}
  }
  root.querySelectorAll<HTMLButtonElement>('[data-scene-choice]').forEach(button=>button.setAttribute('aria-pressed',String(String(s[button.dataset.sceneChoice as keyof typeof s])===button.dataset.value)));
  root.querySelectorAll<HTMLInputElement>('[data-scene-control]').forEach(input=>{input.value=String(s[input.dataset.sceneControl as 'adoption'|'speed'|'review']);});
  root.querySelectorAll<HTMLOutputElement>('[data-scene-output]').forEach(output=>{output.value=`${Number(s[output.dataset.sceneOutput as 'adoption'|'speed'|'review'].toFixed(1))}${output.dataset.unit}`;});
  const status=root.querySelector<HTMLElement>('.story-interaction-status')!;
  if(step.scene==='collaboration')status.textContent=s.reviewed?t('教学例子：已补充购买时间与保修条件。建议可以进入人工确认。','Teaching example: purchase date and warranty conditions added. Ready for human confirmation.'):t('教学例子：“可以直接换新”漏掉了购买时间与保修条件。试着补上它们。','Teaching example: “Replace it immediately” omits purchase date and warranty conditions. Add them.');
  else if(step.scene==='industry'||step.scene==='discovery')status.textContent=s.industry==='science'?t('预测提出候选，实验才能确认；探索空间扩大不等于发现已经成立。','Prediction proposes candidates; experiments confirm. A larger search space does not establish a discovery.'):s.industry==='health'?t('识别结果进入医生复核；能获准使用不等于已证明临床收益。','Recognition feeds clinical review. Approval does not establish clinical benefit.'):t('识别异常 → 人员复核 → 产线处置。实际收益需要良率、停机与复核成本验证。','Flag an anomaly → human review → production action. Validate yield, downtime and review costs.');
  else if(step.scene==='effects')status.textContent=s.compare?t('同一写作实验：时间下降、质量评分上升；两个指标分别阅读。','Same writing experiment: less time, higher quality scores. Read the measures separately.'):t('更快只回答耗时问题。点“也看质量”，检查另一项结果。','Speed answers the time question. Include quality to inspect another outcome.');
  else if(step.scene==='adoption')status.textContent=`${s.year} · ${formatRecord(`adoption-${s.year}`,lang)}% · ${t('受访组织；采用不等于效率收益。','surveyed organizations; adoption is not a productivity gain.')}`;
  else if(step.scene==='enterprise')status.textContent=`${recordById(s.firm).label[lang]} · ${formatRecord(s.firm,lang)}% · ${t('欧盟10人及以上企业；与上一组调查总体不同。','EU firms with 10+ people; a different population from the preceding survey.')}`;
  else if(step.scene==='lab'){
   const result=calculate({tasks:20,adoption:s.adoption,speed:s.speed,review:s.review}),boundary=30*s.adoption/100*(1-1/s.speed);
   status.textContent=`${t('教学模型：节省工时','Teaching model: effort saved')} ${result.saved.toFixed(1)}% · ${t('额外复核临界点','Extra-review break-even')} ${boundary.toFixed(1)}${t(' 分钟/任务',' min/task')}`;
  }else status.textContent='';
  root.hidden=!root.querySelector('button,input');
 }
 sync();
}
