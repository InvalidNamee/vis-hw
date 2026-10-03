import type {StoryStep} from './story-content';
import {sceneState,patchScene} from './story-state';
import {calculate,reviewBreakEven} from './model.mjs';
import {recordById,formatRecord,dataset,type Lang} from './content';

export function renderSceneControls(root:HTMLElement,step:StoryStep,lang:Lang){
 const en=lang==='en',t=(zh:string,english:string)=>en?english:zh;
 const signature=`${step.id}-${lang}`;
 const change=(patch:Parameters<typeof patchScene>[1])=>{
  patchScene(step,patch);sync();root.dispatchEvent(new CustomEvent('story:change',{bubbles:true,detail:{id:step.id}}));
 };
 const group=(label:string,choices:[string,string][],key:'phase'|'industry'|'year'|'firm'|'compare'|'reviewed'|'forecast'|'exposure')=>{
  const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=label;field.append(legend);
  const buttons=document.createElement('div');buttons.className='story-choice-buttons';field.append(buttons);
  choices.forEach(([value,text])=>{const button=document.createElement('button');button.type='button';button.textContent=text;button.dataset.sceneChoice=key;button.dataset.value=value;button.addEventListener('click',()=>change({[key]:key==='phase'||key==='year'?Number(value):key==='compare'||key==='reviewed'||key==='forecast'?value==='true':value}));buttons.append(button);});root.append(field);
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
  if(step.scene==='infrastructure'){
   const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=t('试着拿掉一个基础条件','Try removing a foundation');field.append(legend);
   const items=document.createElement('div');items.className='story-foundation-toggles';field.append(items);
   (['power','compute','data'] as const).forEach((key,i)=>{
    const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.dataset.sceneToggle=key;input.setAttribute('data-hw02-control','');input.addEventListener('change',()=>change({[key]:input.checked}));label.append(input,document.createTextNode([t('电力','Power'),t('算力','Compute'),t('数据可用','Data access')][i]));items.append(label);
   });root.append(field);
  }
  if(step.scene==='energy')group(t('估计与预测，是同一种数据吗？','Is a projection an observation?'),[['false',t('2025估计','2025 estimate')],['true',t('加入2030预测','Add 2030 projection')]],'forecast');
  if(step.scene==='exposure')group(t('同一指数，不同就业分组','Same index, different employment groups'),[['exposure-low',t('低收入','Low income')],['exposure-global',t('全球','Global')],['exposure-high',t('高收入','High income')]],'exposure');
  if(step.scene==='lab'){
   slider(t('AI 参与率','AI participation'),'adoption',0,100,5,'%');
   slider(t('生产加速','Production speed'),'speed',1,8,.5,'×');
   slider(t('额外复核 / 任务','Extra review / task'),'review',0,30,1,t(' 分钟',' min'));
   const button=document.createElement('button');button.type='button';button.className='story-threshold-button';button.textContent=t('找到刚好不省时的点','Find the break-even point');button.addEventListener('click',()=>change({review:reviewBreakEven(sceneState(step))}));root.append(button);
  }
  const status=document.createElement('p');status.className='story-interaction-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
 }
 function sync(){
  const s=sceneState(step);
  const scene=root.closest<HTMLElement>('.story-scene')!,heading=scene.querySelector('figcaption strong')!;
  if(step.scene==='industry'||step.scene==='discovery'){scene.querySelector('.story-scene-note')!.textContent=t('应用关系图与任务机制示意；节点大小、距离和线宽不编码经济规模或实测收益。','Application network and task mechanism; node size, distance and link width do not encode economic scale or measured gains.');heading.textContent=`${dataset.cases.find(c=>c.id===s.industry)!.name[lang]} · ${t('能力 → 任务 → 验证','capability → task → validation')}`;}
  if(step.scene==='lab'){
   heading.textContent=`${t('教学实验','Teaching experiment')} · 20${t('项',' tasks')} / ${s.adoption}% / ${s.speed}× / ${s.review.toFixed(1)}${t('分钟额外复核',' min extra review')}`;
   const result=calculate({tasks:20,adoption:s.adoption,speed:s.speed,review:s.review});
   const facts=scene.querySelectorAll('.story-model-fallback strong');
   [result.baseTotal/60,result.aiTotal/60,result.saved].forEach((v,i)=>{if(facts[i])facts[i].textContent=v.toFixed(1)+(i===2?'%':en?' h':' 小时');});
   const link=scene.closest('story-chapter')?.querySelector<HTMLAnchorElement>(`#${step.id} .story-more`);
   if(link){const url=new URL(link.href);url.search=new URLSearchParams({tasks:'20',adoption:String(s.adoption),speed:String(s.speed),review:String(s.review)}).toString();link.href=url.href;}
  }
  root.querySelectorAll<HTMLButtonElement>('[data-scene-choice]').forEach(button=>button.setAttribute('aria-pressed',String(String(s[button.dataset.sceneChoice as keyof typeof s])===button.dataset.value)));
  root.querySelectorAll<HTMLInputElement>('[data-scene-toggle]').forEach(input=>{input.checked=s[input.dataset.sceneToggle as 'power'|'compute'|'data'];});
  root.querySelectorAll<HTMLInputElement>('[data-scene-control]').forEach(input=>{input.value=String(s[input.dataset.sceneControl as 'adoption'|'speed'|'review']);});
  root.querySelectorAll<HTMLOutputElement>('[data-scene-output]').forEach(output=>{output.value=`${Number(s[output.dataset.sceneOutput as 'adoption'|'speed'|'review'].toFixed(1))}${output.dataset.unit}`;});
  const status=root.querySelector<HTMLElement>('.story-interaction-status')!;
  let message='';
  if(step.scene==='collaboration')message=s.reviewed?t('教学例子：已补充购买时间与保修条件。仍要由人核对适用政策。','Teaching example: purchase date and warranty added. A person still checks the applicable policy.'):step.focus===0?t('教学例子：缺少购买时间与保修条件，先补齐任务的信息。','Teaching example: purchase date and warranty are missing. First add the task context.'):t('教学例子：“可以直接换新”漏掉了购买时间与保修条件。试着补上它们。','Teaching example: “Replace it immediately” omits purchase date and warranty conditions. Add them.');
  else if(step.scene==='industry'||step.scene==='discovery')message=s.industry==='science'?t('预测提出候选，实验才能确认；探索空间扩大不等于发现已经成立。','Prediction proposes candidates; experiments confirm. A larger search space does not establish a discovery.'):s.industry==='health'?t('识别结果进入医生复核；能获准使用不等于已证明临床收益。','Recognition feeds clinical review. Approval does not establish clinical benefit.'):t('识别异常 → 人员复核 → 产线处置。实际收益需要良率、停机与复核成本验证。','Flag an anomaly → human review → production action. Validate yield, downtime and review costs.');
  else if(step.scene==='effects')message=s.compare?`${t('同一实验：耗时指数','Same experiment: time index')} ${100+recordById('time').value} · ${t('质量指数','quality index')} ${100+recordById('quality').value} · ${t('各自基准=100，指标不相加。','each baseline=100; measures are not additive.')}`:t('更快只回答耗时问题。点“也看质量”，检查另一项结果。','Speed answers the time question. Include quality to inspect another outcome.');
  else if(step.scene==='adoption')message=`${s.year} · ${formatRecord(`adoption-${s.year}`,lang)}% · ${t('受访组织；采用不等于效率收益。','surveyed organizations; adoption is not a productivity gain.')}`;
  else if(step.scene==='enterprise')message=`${recordById(s.firm).label[lang]} · ${formatRecord(s.firm,lang)}% · ${t('欧盟10人及以上企业；与上一组调查总体不同。','EU firms with 10+ people; a different population from the preceding survey.')}`;
  else if(step.scene==='infrastructure')message=s.power&&s.compute&&s.data?t('依赖条件已具备；还需要人才、可靠运维与合适流程。这里只演示依赖关系。','Foundations available; skills, maintenance and workflows still matter. This is a dependency illustration.'):t('演示中的输入条件不完整，应用路径受阻。它不计算真实产出或损失。','The illustrated input conditions are incomplete; the application path is blocked. No real output or loss is calculated.');
  else if(step.scene==='energy')message=s.forecast?`${formatRecord('energy-2025',lang)} TWh · ${t('2025历史估计','2025 historical estimate')} / ${formatRecord('energy-2030',lang)} TWh · ${t('2030中央情景预测；全部数据中心，非AI单独用电。','2030 central projection; all data centres, not AI alone.')}`:t('只看历史估计。展开未来预测时，注意虚线和时间口径。','Historical estimate only. Add the projection and notice the dashed boundary and different time basis.');
  else if(step.scene==='exposure')message=`${recordById(s.exposure).label[lang]} · ${formatRecord(s.exposure,lang)}% · ${t('潜在任务暴露，不是失业概率；不同分组不能相加。','potential task exposure, not a job-loss probability; groups are not additive.')}`;
  else if(step.scene==='lab'){
   const result=calculate({tasks:20,adoption:s.adoption,speed:s.speed,review:s.review}),boundary=reviewBreakEven(s);
   message=`${t('教学模型：节省工时','Teaching model: effort saved')} ${result.saved.toFixed(1)}% · ${t('额外复核临界点','Extra-review break-even')} ${boundary.toFixed(1)}${t(' 分钟/任务',' min/task')}`;
  }else message='';
  if(status.textContent!==message)status.textContent=message;
  root.hidden=!root.querySelector('button,input');
 }
 sync();
}
