/** Old story anchors that do not already exist in the new story. */
export const legacyAnchors: Record<string, string> = {
  "factory-vision": "case-manufacturing",
  "clinical-vision": "case-health",
  "scientific-discovery": "case-science",
  "screening-quality": "case-health",
};
export function restoreLegacyAnchor() {
  const target = legacyAnchors[location.hash.slice(1)];
  if (!target) return;
  const url = new URL(location.href);
  url.hash = target;
  history.replaceState(history.state, "", url);
  document.getElementById(target)?.scrollIntoView();
}
