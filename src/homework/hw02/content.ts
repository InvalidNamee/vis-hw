import raw from "../../../public/data/hw02/dataset.json";
export const dataset = raw;
export const recordById = (id: string) => {
  const record = dataset.records.find((r) => r.id === id);
  if (!record) throw new Error(`Unknown HW02 record: ${id}`);
  return record;
};
export const energyBaseline = recordById("energy-2025");
export const periodText = (period: string | number, lang: Lang) =>
  period === "not-confirmed"
    ? lang === "en"
      ? "Collection period not confirmed"
      : "采集期未确认"
    : String(period);
export const formatRecord = (id: string, lang: Lang) => {
  const r = recordById(id),
    prefix =
      r.precision === "greater-than"
        ? "> "
        : r.precision === "approximate"
          ? lang === "en"
            ? "≈ "
            : "约 "
          : "";
  return prefix + r.value.toLocaleString(lang === "en" ? "en-US" : "zh-CN");
};
export type Lang = "zh" | "en";
export type LocalText = { zh: string; en: string };
export const text = (lang: Lang, zh: string, en: string) =>
  lang === "en" ? en : zh;
export const chapters = [
  {
    id: "",
    name: { zh: "完整故事", en: "The full story" },
    title: { zh: "智变", en: "The intelligence shift" },
    desc: {
      zh: "人工智能，如何成为新质生产力？",
      en: "How does AI become a new productive force?",
    },
    kicker: "THE BIG PICTURE",
  },
  {
    id: "trends",
    name: { zh: "发展脉络", en: "The momentum" },
    title: {
      zh: "从技术突破，到广泛采用",
      en: "From breakthrough to adoption",
    },
    desc: {
      zh: "投入为创新创造条件，采用让技术走进实际工作。",
      en: "Investment enables innovation. Adoption brings it into everyday work.",
    },
    kicker: "01 / THE MOMENTUM",
  },
  {
    id: "industries",
    name: { zh: "产业图谱", en: "Industry atlas" },
    title: {
      zh: "一种能力，多种产业可能",
      en: "One capability. Many possibilities.",
    },
    desc: {
      zh: "沿着关系网络，探索 AI 在生产流程中真正发生作用的位置。",
      en: "Follow the connections to see where AI enters a productive process.",
    },
    kicker: "02 / INDUSTRY ATLAS",
  },
  {
    id: "work",
    name: { zh: "人机协作", en: "Working together" },
    title: {
      zh: "生产力的变化，从任务开始",
      en: "Productivity starts with a task",
    },
    desc: {
      zh: "走进具体研究：谁得到了帮助，改善了什么，又有哪些限制？",
      en: "Look inside the studies: who benefits, what improves, and where are the limits?",
    },
    kicker: "03 / HUMAN + AI",
  },
  {
    id: "lab",
    name: { zh: "生产力实验室", en: "Productivity lab" },
    title: {
      zh: "亲手调节，发现效率的边界",
      en: "Find the limits of acceleration",
    },
    desc: {
      zh: "给流程加入 AI，观察局部加速如何改变总工时。",
      en: "Add AI to a workflow and watch a local speed-up change the total effort.",
    },
    kicker: "04 / THE EXPERIMENT",
  },
  {
    id: "transition",
    name: { zh: "转型与边界", en: "Beyond the gains" },
    title: {
      zh: "让潜力，成为可持续的进步",
      en: "Turn potential into lasting progress",
    },
    desc: {
      zh: "算力依赖能源，应用依赖人才，可信的结果依赖复核。",
      en: "Compute needs energy. Adoption needs skills. Reliable outcomes need review.",
    },
    kicker: "05 / BEYOND THE GAINS",
  },
  {
    id: "sources",
    name: { zh: "数据与方法", en: "Data & methods" },
    title: { zh: "每一个结论，都有来处", en: "Every claim has a source" },
    desc: {
      zh: "查看数据口径、研究限制，以及这组可视化的实现方法。",
      en: "Explore definitions, research limitations, and the methods behind the visuals.",
    },
    kicker: "06 / OPEN NOTEBOOK",
  },
] as const;
export const sourceById = (id: string) =>
  dataset.sources.find((s) => s.id === id)!;
