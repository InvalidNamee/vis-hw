import type {Lang} from './content';
// One readable claim per scene. Research context remains in the expandable text.
const beats:Record<string,[string,string]>={
 'find-knowledge':['客户问：商品能直接换新吗？先补齐购买时间、保修范围和故障信息。','Can this product be replaced? First establish the purchase date, warranty and fault.'],
 'ai-assists':['AI 能整理一份草稿。缺失的条件，仍需要人补齐。','AI can organize a draft. A person still needs to supply the missing conditions.'],
 'human-delivers':['在一项客服研究中，AI 辅助提高了每小时解决问题数。这个结果有具体的任务和样本边界。','AI assistance increased issues resolved per hour in one support study. The result belongs to a specific task and sample.'],
 'factory-vision':['识别异常只是起点。复核和处置把能力接入产线。','Detecting an anomaly is a starting point. Review and action connect the capability to production.'],
 'clinical-vision':['同样的视觉能力，进入医疗后需要不同的验证与责任安排。','The same visual capability needs different validation and responsibilities in healthcare.'],
 'scientific-discovery':['预测扩大可探索的范围。实验决定候选结果是否成立。','Prediction expands what can be explored. Experiments establish whether a candidate holds up.'],
 'writing-time':['先看时间：这项写作实验中，AI 辅助减少了完成任务的耗时。','Start with time: AI assistance reduced completion time in this writing experiment.'],
 'writing-quality':['再看质量。更快与更好，是两项需要分别验证的结果。','Then inspect quality. Faster and better are outcomes that need separate validation.'],
 'screening-quality':['医疗结果不能只用一个效率数字概括。检出与进一步检查需要一起看。','A single efficiency number cannot describe clinical outcomes. Read detection and further checks together.'],
 'developer-conditions':['研究任务、工具和人员不同，结果也可能不同。加速不是默认结论。','Results can change with tasks, tools and participants. A speed-up is not the default conclusion.'],
 'adoption-spreads':['更多受访组织报告使用 AI。采用范围扩大，并不直接说明效率提高。','More surveyed organizations report using AI. Wider adoption does not directly establish higher productivity.'],
 'size-gap':['企业规模与采用差距相关。试着比较同一统计口径下的三类企业。','Adoption differs by firm size. Compare three groups within the same statistical population.'],
 'physical-foundations':['应用依赖电力、算力和数据。关闭一个条件，看路径怎样受阻。','Applications depend on power, compute and data. Switch off one input to inspect the dependency.'],
 'energy-boundary':['资源需求也会增长。历史估计与未来预测，需要明确区分。','Resource demand can grow too. Distinguish historical estimates from future projections.'],
 'tasks-change':['任务可能改变，不等于岗位已经消失。比较不同收入群体的潜在暴露。','Tasks may change; that does not mean jobs have disappeared. Compare potential exposure across income groups.'],
 'baseline-workflow':['把一项工作拆开：需求、生产、复核与交付。先看它的时间结构。','Break a task into briefing, production, review and delivery. Start with its time structure.'],
 'accelerated-production':['缩短生产阶段，会留下多少净收益？调节参与率和速度，观察同一流程。','How much net gain does faster production leave? Adjust participation and speed within the same workflow.'],
 'review-cost':['把额外复核计入，收益可能反转。找到刚好抵消加速的临界点。','Extra review can reverse the gain. Find the point where review exactly offsets faster production.']
};
export const storyBeat=(id:string,lang:Lang)=>beats[id]?.[lang==='en'?1:0]??'';
