import { dataset, type LocalText } from "../data";
const bi = (zh: string, en: string): LocalText => ({ zh, en });
export interface StoryStep {
  id: string;
  title: LocalText;
  body: LocalText;
  scene: string;
  sources: string[];
}
export interface StoryChapter {
  id: string;
  title: LocalText;
  intro: LocalText;
  steps: StoryStep[];
  explore: string;
}
const step = (
  id: string,
  zh: string,
  en: string,
  bodyZh: string,
  bodyEn: string,
  scene: string,
  sources: string[],
): StoryStep => ({
  id,
  title: bi(zh, en),
  body: bi(bodyZh, bodyEn),
  scene,
  sources,
});
export const storyChapters: StoryChapter[] = [
  {
    id: "workplace",
    title: bi("从一个工作现场说起", "Begin with a working day"),
    intro: bi(
      "技术进了流程，变化才真正开始。",
      "Change begins when technology enters a workflow.",
    ),
    explore: "workplace-explore",
    steps: [
      step(
        "find-knowledge",
        "先找到能解决问题的知识",
        "First, find the knowledge",
        "检索资料、弄清问题、组织答案，然后核对与交付。一项工作拆开看是许多任务，写出一份答案只是其中一段。图中所示是流程关系，不是实测耗时。",
        "Retrieve information, understand the problem, compose an answer, then review and deliver. Producing an answer is only one part of the job. This diagram shows a workflow, not measured time.",
        "workflow-0",
        ["nber"],
      ),
      step(
        "ai-assists",
        "把 AI 接到具体任务上",
        "Bring AI into a specific task",
        "AI 可以帮忙找知识、起草稿、提建议。看它如何接入流程：信息更快到达工位，但建议是否成立，仍要结合具体情境判断。",
        "AI can retrieve knowledge, draft text and suggest an answer. Watch assistance enter the workflow: information reaches the worker, while context still requires judgment.",
        "workflow-1",
        ["nber"],
      ),
      step(
        "human-delivers",
        "最后一步，仍然交给人判断",
        "Human judgment completes the work",
        "快不是唯一目标。算效率，要把复核成本算进去；谈质量，要在具体任务上检验；讲创新，也离不开验证。接下来走进五个产业，看这些条件如何变化。",
        "Speed is not the only goal. Efficiency includes review costs, quality needs task-specific evaluation, and innovation requires validation. Explore how these conditions differ across five industries.",
        "workflow-2",
        ["nber", "worldbank"],
      ),
    ],
  },
  {
    id: "capabilities",
    title: bi("能力，怎么进入产业？", "How do capabilities enter industry?"),
    intro: bi(
      "能力可以相同，流程与责任各不相同。",
      "Shared capabilities. Different workflows and responsibilities.",
    ),
    explore: "applications",
    steps: ["manufacturing", "health", "agriculture", "science", "service"]
      .map((id) => dataset.cases.find((c) => c.id === id)!)
      .map((c) => ({
        id: `case-${c.id}`,
        title: c.task,
        body: bi(
          `${c.meaning.zh}流程由“${c.before.zh.join(" → ")}”转向“${c.after.zh.join(" → ")}”。${c.limit.zh}`,
          `${c.meaning.en} From “${c.before.en.join(" → ")}” to “${c.after.en.join(" → ")}”. ${c.limit.en}`,
        ),
        scene: `industry-${c.id}`,
        sources: [c.source],
      })),
  },
  {
    id: "evidence",
    title: bi("有没有用，要用证据来量", "Measure the change"),
    intro: bi(
      "先看清量的是什么，再谈收益。",
      "Understand the measure before interpreting the gain.",
    ),
    explore: "benefits",
    steps: [
      step(
        "support-gains",
        "客服：同样的时间，解决更多问题",
        "Support: more issues resolved per hour",
        "客服研究观察到，平均每小时解决的问题数多了约 15%。这是特定工作场景的结果；经验、任务和组织环境都会影响收益，不能推及所有岗位。",
        "The support study reports about 15% more issues resolved per hour on average. This is a specific workplace result; experience, tasks and organizations affect gains. It does not predict every occupation.",
        "effects-support",
        ["nber"],
      ),
      step(
        "writing-time",
        "写作：先看耗时",
        "Writing: examine the time",
        "研究把参与者分组完成指定的写作任务。这里以各组基准为 100，看完成时间的相对变化；数值更低代表更快，但不代表质量也按同样幅度提升。",
        "Participants completed specific writing tasks in different groups. With the baseline indexed to 100, lower completion time means faster work. It does not imply an equal improvement in quality.",
        "effects-time",
        ["writing"],
      ),
      step(
        "writing-quality",
        "再看质量：单独保留一个指标",
        "Then examine quality separately",
        "质量评分和完成时间，量的不是一回事。两者合起来能说明一个场景，但不能相加，也不能把不同研究的指数放在一起排名。",
        "Quality scores and completion time measure different things. Together they illuminate a setting, but cannot be added or used to rank unrelated studies.",
        "effects-quality",
        ["writing"],
      ),
      step(
        "developer-conditions",
        "换一个现场，结论可能就变了",
        "A different workplace can change the result",
        "开发者研究分别比较任务数量和任务耗时。METR 的后续研究存在选择偏差与计时问题，早期结果说明不了当前工具的普遍效果。",
        "Developer studies compare task counts and time separately. METR’s follow-up faces selection and timing issues, so early findings cannot establish the general effect of current tools.",
        "developers",
        ["developers", "metr", "metr26"],
      ),
    ],
  },
  {
    id: "diffusion",
    title: bi("技术在扩散，机会并不平均", "Adoption grows, unevenly"),
    intro: bi(
      "投入、采用与收益，是三件不同的事。",
      "Investment, adoption and gains are different measures.",
    ),
    explore: "adoption",
    steps: [
      step(
        "adoption-spreads",
        "更多组织开始使用 AI",
        "More organizations use AI",
        "看 2023 至 2025 年受访组织使用 AI 的比例随时间的变化。每年的调查样本可能不同，这条线描述的是调查结果，不代表全球所有企业。",
        "Follow reported AI use among surveyed organizations from 2023 to 2025. Annual samples may differ; this line describes surveys, not every firm worldwide.",
        "adoption",
        ["hai25", "hai26"],
      ),
      step(
        "size-gap",
        "规模不同，能采用的条件也不同",
        "Firm size changes adoption conditions",
        "欧盟按企业规模分组，露出另一种差距。资金、技能、数据和组织能力决定应用条件；这个统计与前面的受访组织不是同一个总体。",
        "EU enterprise-size groups reveal another gap. Funding, skills, data and organization shape adoption conditions. This population differs from the survey shown before.",
        "enterprise",
        ["eurostat"],
      ),
      step(
        "investment-context",
        "投入与部署，只是应用的背景",
        "Investment and deployment provide context",
        "私人投资、中国 AI 核心产业规模和机器人安装量，反映的是不同背景。它们有助于解释应用条件，却不直接测量 AI 带来的生产率收益。完整图表在本章探索区。",
        "Private investment, China’s AI industry scale and robot installations describe different conditions. They do not directly measure AI-caused productivity gains. Explore the full charts below.",
        "investment",
        ["hai26", "china", "ifr"],
      ),
    ],
  },
  {
    id: "conditions",
    title: bi("潜力要落地，得有实现条件", "Potential needs foundations"),
    intro: bi(
      "从物理资源，到组织，再到人的责任。",
      "From physical resources to organizations and human responsibility.",
    ),
    explore: "boundaries",
    steps: [
      step(
        "physical-foundations",
        "智能也要依托物理世界",
        "Intelligence needs a physical world",
        "可用的数据、连接、算力和能源支撑着应用。图中的连线表示依赖关系，不表示消耗多少；要真正部署，还需要人才、培训和明确的复核责任。",
        "Data, connectivity, compute and energy support applications. Links show dependencies, not quantities of consumption. Deployment also needs skills, training and clear review responsibilities.",
        "foundations",
        ["worldbank", "iea"],
      ),
      step(
        "energy-boundary",
        "把历史估计与未来预测分开",
        "Separate estimates from projections",
        "2025 年数据中心用电是历史估计，2030 年是中央情景预测。两者都是全球全部数据中心，包含多种负载，不能把用电全算在 AI 头上。",
        "Data-centre electricity use for 2025 is a historical estimate; 2030 is a central projection. Both cover all global data centres and multiple workloads, not AI alone.",
        "energy",
        ["iea"],
      ),
      step(
        "tasks-change",
        "任务暴露，不等于岗位消失",
        "Exposure does not mean job loss",
        "职业任务可能受到生成式 AI 影响，但这不等于已经被采用，也不是失业概率。要理解变化，得把任务拆开，保留判断与责任，并持续检验工作质量。",
        "Occupational tasks may be affected by generative AI. Exposure is neither actual adoption nor a probability of job loss. Examine tasks, preserve judgment and responsibility, and keep evaluating quality.",
        "exposure",
        ["ilo"],
      ),
    ],
  },
  {
    id: "experiment",
    title: bi("现在，假设交给你", "Put the assumptions in your hands"),
    intro: bi(
      "生产加快了，总时间就一定省下来了吗？",
      "Does faster production always save total time?",
    ),
    explore: "parameters",
    steps: [
      step(
        "baseline-workflow",
        "同一个任务，同一条时间轴",
        "One task, one time scale",
        "先看基准流程：需求、生产、复核、交付。这是一个假设明确的串行工时模型，不是某个行业的实测收益；两种流程始终使用同一时间比例。",
        "Start with requirements, production, review and delivery. This is a serial-effort teaching model with explicit assumptions, not an industry measurement. Both workflows use the same time scale.",
        "lab-0",
        [],
      ),
      step(
        "accelerated-production",
        "生产加速了，其他阶段还在",
        "Production speeds up; other stages remain",
        "让 60% 的任务在生产阶段获得 3 倍加速。生产段缩短了，需求、复核与交付依然占时间；总时间怎么变，由整条流程决定。",
        "Give 60% of tasks a threefold production speedup. Production shrinks while requirements, review and delivery remain. The entire workflow determines total time.",
        "lab-1",
        [],
      ),
      step(
        "review-cost",
        "把复核成本加回来",
        "Add the review cost back",
        "每项任务再加 4 分钟复核，收益就变小；复核足够高时甚至可能变成负收益。继续向下，调四个参数，找出你的情景与盈亏边界。",
        "Add four minutes of review per task and the gain shrinks. Sufficient review can make gains negative. Continue below to adjust four parameters and find the break-even point.",
        "lab-2",
        [],
      ),
    ],
  },
];
