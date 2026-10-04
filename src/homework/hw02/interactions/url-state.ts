export const stateEvent = "hw02:state";
export const fromUrl = (key: string, fallback: string) =>
  new URL(location.href).searchParams.get(key) ?? fallback;
export function setParams(values: Record<string, string>) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  history.replaceState(history.state, "", url);
  window.dispatchEvent(new Event(stateEvent));
}
export function restoreControl(
  control: HTMLInputElement | HTMLSelectElement,
  fallback: string,
) {
  const raw = fromUrl(control.dataset.control!, fallback);
  if (control instanceof HTMLSelectElement)
    control.value = Array.from(control.options).some((o) => o.value === raw)
      ? raw
      : fallback;
  else if (control.type === "range") {
    const value = raw.trim() === "" ? NaN : Number(raw);
    control.value = String(
      Number.isFinite(value)
        ? Math.min(Number(control.max), Math.max(Number(control.min), value))
        : fallback,
    );
  } else control.value = raw;
}
