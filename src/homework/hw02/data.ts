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
export const sourceById = (id: string) =>
  dataset.sources.find((s) => s.id === id)!;
