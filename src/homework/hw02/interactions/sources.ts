import { fromUrl, setParams } from "./url-state";
class SourceBrowser extends HTMLElement {
  private abort?: AbortController;
  connectedCallback() {
    this.abort = new AbortController();
    const opts = { signal: this.abort.signal };
    const search = this.querySelector<HTMLInputElement>(
      '[data-control="search"]',
    )!;
    const select = this.querySelector<HTMLSelectElement>(
      '[data-control="sourceType"]',
    )!;
    const render = () => {
      this.querySelectorAll<HTMLInputElement>(
        '[data-choice="sourceType"]',
      ).forEach((r) => (r.checked = r.value === select.value));
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      this.querySelectorAll<HTMLElement>("[data-source-row]").forEach((row) => {
        row.hidden =
          !(
            (row.textContent ?? "") +
            " " +
            (row.querySelector("a")?.href ?? "")
          )
            .toLocaleLowerCase()
            .includes(query) ||
          (select.value !== "all" && row.dataset.evidenceType !== select.value);
        if (!row.hidden) count++;
      });
      const en = this.dataset.lang === "en";
      this.querySelector("[data-count]")!.textContent = en
        ? `${count} sources`
        : `${count} 个来源`;
      this.querySelector("[data-status]")!.textContent = count
        ? ""
        : en
          ? "No matching sources. Try another term."
          : "没有匹配的来源，请换一个关键词。";
    };
    const restore = () => {
      search.value = fromUrl("search", "");
      const type = fromUrl("sourceType", "all");
      select.value = ["all", "statistics", "study", "case"].includes(type)
        ? type
        : "all";
      render();
    };
    const update = () => {
      setParams({ search: search.value, sourceType: select.value });
      render();
    };
    search.addEventListener("input", update, opts);
    select.addEventListener("change", update, opts);
    this.querySelectorAll<HTMLInputElement>(
      '[data-choice="sourceType"]',
    ).forEach((r) =>
      r.addEventListener(
        "change",
        () => {
          select.value = r.value;
          update();
        },
        opts,
      ),
    );
    window.addEventListener("popstate", restore, opts);
    restore();
  }
  disconnectedCallback() {
    this.abort?.abort();
  }
}
if (!customElements.get("source-browser"))
  customElements.define("source-browser", SourceBrowser);
