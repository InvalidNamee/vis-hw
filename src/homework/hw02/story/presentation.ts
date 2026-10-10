import type { Lang, LocalText } from "../data";
import type { StoryChapter } from "./content";

export type SceneFamily =
  "workflow" | "network" | "comparison" | "trend" | "resources" | "model";
export const sceneFamily = (scene: string): SceneFamily => {
  if (scene.startsWith("workflow")) return "workflow";
  if (scene.startsWith("industry")) return "network";
  if (scene.startsWith("lab")) return "model";
  if (scene === "foundations" || scene === "energy" || scene === "exposure")
    return "resources";
  if (["adoption", "enterprise", "investment"].includes(scene)) return "trend";
  return "comparison";
};

// The diagram's reading direction determines the composition, independent of chapter order.
const compositions: Record<
  SceneFamily,
  { layout: "split" | "reverse" | "wide"; label: LocalText }
> = {
  workflow: { layout: "split", label: { zh: "工作流程", en: "The workflow" } },
  network: {
    layout: "reverse",
    label: { zh: "产业与能力的连接", en: "Industries and capabilities" },
  },
  comparison: {
    layout: "wide",
    label: { zh: "研究对照", en: "Reading the evidence" },
  },
  trend: {
    layout: "reverse",
    label: { zh: "采用与投入", en: "Adoption and investment" },
  },
  resources: {
    layout: "split",
    label: { zh: "实现条件与边界", en: "Foundations and boundaries" },
  },
  model: {
    layout: "wide",
    label: { zh: "在同一时间轴上比较", en: "Compare on one time scale" },
  },
};
export function presentationFor(chapter: StoryChapter, lang: Lang) {
  const family = sceneFamily(chapter.steps[0].scene);
  return {
    family,
    layout: compositions[family].layout,
    label: compositions[family].label[lang],
  };
}
