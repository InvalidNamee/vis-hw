import { storyLabParams, type StoryStep } from "./content";

export type SceneState = {
  phase: number;
  industry: string;
  year: number;
  firm: string;
  compare: boolean;
  reviewed: boolean;
  adoption: number;
  speed: number;
  review: number;
  power: boolean;
  compute: boolean;
  data: boolean;
  forecast: boolean;
  exposure: string;
};
// Module lifetime survives the site's in-place language swaps; no research data is mutated.
const states = new Map<string, SceneState>();
let draftReviewed = false;
export function sceneState(step: StoryStep): SceneState {
  let state = states.get(step.id);
  if (!state) {
    const lab = storyLabParams(step.lab);
    state = {
      phase: step.focus ?? 0,
      industry:
        step.industry ??
        (step.scene === "discovery" ? "science" : "manufacturing"),
      year: 2025,
      firm: "eu-small",
      compare: step.outcome === "quality",
      reviewed: false,
      adoption: lab.adoption,
      speed: lab.speed,
      review: lab.review,
      power: true,
      compute: true,
      data: true,
      forecast: true,
      exposure: "exposure-global",
    };
    states.set(step.id, state);
  }
  if (step.scene === "collaboration") state.reviewed = draftReviewed;
  return state;
}
export function patchScene(step: StoryStep, patch: Partial<SceneState>) {
  if (step.scene === "collaboration" && patch.reviewed !== undefined)
    draftReviewed = patch.reviewed;
  Object.assign(sceneState(step), patch);
}
export function sceneFamily(step: StoryStep) {
  if (step.scene === "industry" || step.scene === "discovery")
    return "industry";
  if (step.scene === "adoption" || step.scene === "enterprise") return "mosaic";
  return step.scene;
}
