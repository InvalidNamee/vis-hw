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
  eyebrow: string;
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
    title: bi("从一个工作现场开始", "Begin with a working day"),
    eyebrow: "01 / THE WORKFLOW",
    intro: bi(
      "技术进入流程，变化才开始。",
      "Change begins when technology enters a workflow.",
    ),
    explore: "workplace-explore",
    steps: [
      step(
        "find-knowledge",
        "先找到解决问题的知识",
        "First, find the knowledge",
        "检索资料、理解问题、组织答案，再核对与交付。工作由不同任务组成，生产一份答案只是其中一段。图中展示的是流程关系，不是实测耗时。",
        "Retrieve information, understand the problem, compose an answer, then review and deliver. Producing an answer is only one part of the job. This diagram shows a workflow, not measured time.",
        "workflow-0",
        ["nber"],
      ),
      step(
        "ai-assists",
        "让 AI 进入具体任务",
        "Bring AI into a specific task",
        "AI 可以帮助寻找知识、形成草稿和提出建议。观察辅助能力接入流程：信息更快到达工作现场，但建议仍需要结合情境判断。",
        "AI can retrieve knowledge, draft text and suggest an answer. Watch assistance enter the workflow: information reaches the worker, while context still requires judgment.",
        "workflow-1",
        ["nber"],
      ),
      step(
        "human-delivers",
        "最后一步，仍需要人的判断",
        "Human judgment completes the work",
        "速度不是唯一目标。效率要计入复核成本，质量需要具体任务检验，创新也需要验证。接下来走进五个产业，看看这些条件如何改变。",
        "Speed is not the only goal. Efficiency includes review costs, quality needs task-specific evaluation, and innovation requires validation. Explore how these conditions differ across five industries.",
        "workflow-2",
        ["nber", "worldbank"],
      ),
    ],
  },
  {
    id: "capabilities",
    title: bi("能力，怎样进入产业？", "How do capabilities enter industry?"),
    eyebrow: "02 / CAPABILITIES",
    intro: bi(
      "相同能力，不同流程与责任。",
      "Shared capabilities. Different workflows and responsibilities.",
    ),
    explore: "applications",
    steps: ["manufacturing", "health", "agriculture", "science", "service"]
      .map((id) => dataset.cases.find((c) => c.id === id)!)
      .map((c) => ({
        id: `case-${c.id}`,
        title: c.task,
        body: bi(
          `${c.meaning.zh}从“${c.before.zh.join(" → ")}”，到“${c.after.zh.join(" → ")}”。${c.limit.zh}`,
          `${c.meaning.en} From “${c.before.en.join(" → ")}” to “${c.after.en.join(" → ")}”. ${c.limit.en}`,
        ),
        scene: `industry-${c.id}`,
        sources: [c.source],
      })),
  },
  {
    id: "evidence",
    title: bi("变化，要用证据来验证", "Measure the change"),
    eyebrow: "03 / THE EVIDENCE",
    intro: bi(
      "看清测量了什么，再谈收益。",
      "Understand the measure before interpreting the gain.",
    ),
    explore: "benefits",
    steps: [
      step(
        "support-gains",
        "客服：同样时间解决更多问题",
        "Support: more issues resolved per hour",
        "客服研究观察到平均每小时解决问题数提升约 15%。这是特定工作场景的结果；经验、任务与组织环境会影响收益，不能外推为所有岗位的共同变化。",
        "The support study reports about 15% more issues resolved per hour on average. This is a specific workplace result; experience, tasks and organizations affect gains. It does not predict every occupation.",
        "effects-support",
        ["nber"],
      ),
      step(
        "writing-time",
        "写作：先看耗时",
        "Writing: examine the time",
        "研究将参与者分组完成特定写作任务。这里以各组基准为 100，观察完成时间的相对变化；更低意味着更快，不等于质量也按同样比例提升。",
        "Participants completed specific writing tasks in different groups. With the baseline indexed to 100, lower completion time means faster work. It does not imply an equal improvement in quality.",
        "effects-time",
        ["writing"],
      ),
      step(
        "writing-quality",
        "再看质量，保留独立指标",
        "Then examine quality separately",
        "质量评分与完成时间衡量不同内容。两者可以共同说明一个场景，但不能相加，也不能把不同研究的指数放在一起排名。",
        "Quality scores and completion time measure different things. Together they illuminate a setting, but cannot be added or used to rank unrelated studies.",
        "effects-quality",
        ["writing"],
      ),
      step(
        "developer-conditions",
        "换一个现场，结果可能改变",
        "A different workplace can change the result",
        "开发者研究的任务数量与任务耗时分别比较。METR 后续研究存在选择偏差与计时问题，因此早期结果不能代表当前工具的普遍效果。",
        "Developer studies compare task counts and time separately. METR’s follow-up faces selection and timing issues, so early findings cannot establish the general effect of current tools.",
        "developers",
        ["developers", "metr", "metr26"],
      ),
    ],
  },
  {
    id: "diffusion",
    title: bi("技术在扩散，机会有差异", "Adoption grows, unevenly"),
    eyebrow: "04 / DIFFUSION",
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
        "沿时间观察 2023 至 2025 年受访组织使用 AI 的比例。每年的调查样本可能变化，这条线描述调查结果，不代表全球全部企业。",
        "Follow reported AI use among surveyed organizations from 2023 to 2025. Annual samples may differ; this line describes surveys, not every firm worldwide.",
        "adoption",
        ["hai25", "hai26"],
      ),
      step(
        "size-gap",
        "规模不同，采用条件也不同",
        "Firm size changes adoption conditions",
        "欧盟企业规模分组展示另一种差距。资金、技能、数据与组织能力影响应用条件；这一统计与前面的受访组织并非同一总体。",
        "EU enterprise-size groups reveal another gap. Funding, skills, data and organization shape adoption conditions. This population differs from the survey shown before.",
        "enterprise",
        ["eurostat"],
      ),
      step(
        "investment-context",
        "投入与部署，构成应用背景",
        "Investment and deployment provide context",
        "私人投资、中国 AI 核心产业规模和机器人安装反映不同背景。它们帮助解释应用条件，但不直接测量 AI 造成的生产率收益。完整图表在本章探索区。",
        "Private investment, China’s AI industry scale and robot installations describe different conditions. They do not directly measure AI-caused productivity gains. Explore the full charts below.",
        "investment",
        ["hai26", "china", "ifr"],
      ),
    ],
  },
  {
    id: "conditions",
    title: bi("潜力，需要实现条件", "Potential needs foundations"),
    eyebrow: "05 / THE BOUNDARIES",
    intro: bi(
      "从物理资源，到组织与人的责任。",
      "From physical resources to organizations and human responsibility.",
    ),
    explore: "boundaries",
    steps: [
      step(
        "physical-foundations",
        "智能也依赖物理世界",
        "Intelligence needs a physical world",
        "可用数据、连接、算力和能源支撑应用。图中的连接表示依赖关系，不表示资源消耗的大小；部署还需要人才、培训和明确的复核责任。",
        "Data, connectivity, compute and energy support applications. Links show dependencies, not quantities of consumption. Deployment also needs skills, training and clear review responsibilities.",
        "foundations",
        ["worldbank", "iea"],
      ),
      step(
        "energy-boundary",
        "区分历史估计与未来预测",
        "Separate estimates from projections",
        "2025 年数据中心用电为历史估计，2030 年为中央情景预测。两者涉及全球全部数据中心，包含多种负载，不能把消耗全部归因于 AI。",
        "Data-centre electricity use for 2025 is a historical estimate; 2030 is a central projection. Both cover all global data centres and multiple workloads, not AI alone.",
        "energy",
        ["iea"],
      ),
      step(
        "tasks-change",
        "任务暴露，不等于岗位消失",
        "Exposure does not mean job loss",
        "职业任务可能受到生成式 AI 影响，不意味着已经采用，也不是失业概率。理解变化需要拆解任务、保留判断和责任，并持续验证工作质量。",
        "Occupational tasks may be affected by generative AI. Exposure is neither actual adoption nor a probability of job loss. Examine tasks, preserve judgment and responsibility, and keep evaluating quality.",
        "exposure",
        ["ilo"],
      ),
    ],
  },
  {
    id: "experiment",
    title: bi("把假设交给你", "Put the assumptions in your hands"),
    eyebrow: "06 / YOUR EXPERIMENT",
    intro: bi(
      "加速了生产，是否就节省了总时间？",
      "Does faster production always save total time?",
    ),
    explore: "parameters",
    steps: [
      step(
        "baseline-workflow",
        "同一个任务，同一条时间轴",
        "One task, one time scale",
        "先看基准流程：需求、生产、复核和交付。这是明确假设的串行工时模型，不是某个行业的实测收益；两种流程始终使用同一时间比例。",
        "Start with requirements, production, review and delivery. This is a serial-effort teaching model with explicit assumptions, not an industry measurement. Both workflows use the same time scale.",
        "lab-0",
        [],
      ),
      step(
        "accelerated-production",
        "生产加速，其他阶段仍然存在",
        "Production speeds up; other stages remain",
        "让 60% 的任务在生产阶段获得 3 倍加速。生产段缩短，而需求、复核与交付仍保留。总时间的变化由整条流程共同决定。",
        "Give 60% of tasks a threefold production speedup. Production shrinks while requirements, review and delivery remain. The entire workflow determines total time.",
        "lab-1",
        [],
      ),
      step(
        "review-cost",
        "把复核成本加回来",
        "Add the review cost back",
        "每项任务增加 4 分钟复核后，收益会减小；复核足够高时也可能出现负收益。继续向下，调节四个参数，寻找你的情景与盈亏边界。",
        "Add four minutes of review per task and the gain shrinks. Sufficient review can make gains negative. Continue below to adjust four parameters and find the break-even point.",
        "lab-2",
        [],
      ),
    ],
  },
];
