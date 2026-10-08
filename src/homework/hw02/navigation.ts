import type { LocalText } from "./data";
export type PageId = "" | "sources";
export type LegacyPageId =
  "industries" | "lab" | "trends" | "work" | "transition";
export type RouteId = PageId | LegacyPageId;
export interface Chapter {
  id: PageId;
  name: LocalText;
  title: LocalText;
  desc: LocalText;
}
export const chapters: readonly Chapter[] = [
  {
    id: "",
    name: { zh: "滚动故事", en: "The story" },
    title: { zh: "智变", en: "The intelligence shift" },
    desc: {
      zh: "人工智能，怎样成为新质生产力？",
      en: "How does AI become a productive force?",
    },
  },
  {
    id: "sources",
    name: { zh: "数据与方法", en: "Data & methods" },
    title: { zh: "每一个结论，都有来处", en: "Every claim has a source" },
    desc: {
      zh: "查看数据口径、研究限制与可视化做法。",
      en: "Inspect definitions, research limitations and visualization methods.",
    },
  },
];
export const legacyRoutes = {
  industries: "applications",
  lab: "parameters",
  trends: "adoption",
  work: "benefits",
  transition: "boundaries",
} as const;
export const routes: readonly RouteId[] = [
  ...chapters.map((c) => c.id),
  ...(Object.keys(legacyRoutes) as LegacyPageId[]),
];
