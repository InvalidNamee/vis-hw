import test from "node:test";
import { csvFor } from "../scripts/hw02-data.mjs";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const root = new URL("../dist/", import.meta.url);
const chapters = ["", "sources/"];
const legacy = {
  industries: "applications",
  lab: "parameters",
  trends: "adoption",
  work: "benefits",
  transition: "boundaries",
};
const dataset = JSON.parse(
  readFileSync(
    new URL("../public/data/hw02/dataset.json", import.meta.url),
    "utf8",
  ),
);

test("story and sources have localized navigation and resolvable internal links", () => {
  for (const prefix of ["", "en/"])
    for (const chapter of chapters) {
      const path = `${prefix}hw02/${chapter}`,
        html = readFileSync(new URL(`${path}index.html`, root), "utf8");
      assert.match(html, /class="story-nav"/);
      assert.doesNotMatch(html, /class="hw-sidebar"/);
      for (const [, href] of html.matchAll(/href="(\/[^"?#]*)"/g))
        if (href.endsWith("/"))
          assert.ok(existsSync(new URL(`.${href}index.html`, root)), href);
      if (prefix) {
        const visible = html
          .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, "")
          .replace(/<[^>]+>/g, "")
          .replaceAll("中文", "");
        assert.doesNotMatch(visible, /\p{Script=Han}/u, path);
      }
    }
});
test("all numeric records and industry cases have source provenance", () => {
  const ids = new Set(dataset.sources.map((s) => s.id));
  assert.equal(ids.size, dataset.sources.length);
  assert.equal(
    new Set(dataset.records.map((r) => r.id)).size,
    dataset.records.length,
  );
  for (const r of dataset.records) {
    assert.ok(ids.has(r.source));
    assert.ok(Number.isFinite(r.value));
    assert.ok(r.unit);
    assert.ok(r.scope.zh && r.scope.en);
    assert.ok(r.period);
  }
  for (const c of dataset.cases) {
    assert.ok(ids.has(c.source));
    assert.ok(c.limit.zh && c.limit.en);
    assert.ok(c.capabilities.length);
  }
  assert.equal(
    dataset.records.find((r) => r.id === "energy-2030").kind,
    "projection",
  );
  assert.equal(
    dataset.records.find((r) => r.id === "energy-2025").kind,
    "estimate",
  );
});
test("downloads are published and laboratory assumptions are present in both languages", () => {
  for (const name of ["indicators.csv", "dataset.json"])
    assert.ok(existsSync(new URL(`data/hw02/${name}`, root)));
  for (const prefix of ["", "en/"]) {
    const html = readFileSync(
      new URL(`${prefix}hw02/index.html`, root),
      "utf8",
    );
    assert.match(html, /T = n/);
    assert.match(html, /data-result="saved"/);
    for (const key of ["tasks", "adoption", "speed", "review"])
      assert.ok(html.includes(`data-control="${key}"`));
  }
});

test("published CSV is generated from the same records and source metadata as JSON", () => {
  const published = JSON.parse(
    readFileSync(new URL("data/hw02/dataset.json", root), "utf8"),
  );
  assert.deepEqual(published, dataset);
  assert.equal(
    readFileSync(new URL("data/hw02/indicators.csv", root), "utf8"),
    csvFor(published),
  );
  for (const r of dataset.records) {
    assert.ok(
      r.precision &&
        r.denominator.zh &&
        r.denominator.en &&
        r.limitation.zh &&
        r.limitation.en,
      r.id,
    );
    const source = dataset.sources.find((s) => s.id === r.source);
    assert.ok(source.publishedAt && source.verifiedAt, r.id);
    if (r.confidenceInterval) {
      assert.ok(
        r.confidenceInterval[0] <= r.value &&
          r.value <= r.confidenceInterval[1],
        r.id,
      );
      assert.ok(r.confidenceLevel > 0 && r.confidenceLevel < 1);
    }
  }
  assert.equal(
    dataset.records.find((r) => r.id === "dev-tasks").confidenceInterval,
    undefined,
  );
  assert.equal(
    dataset.records.find((r) => r.id === "dev-tasks").standardError,
    10.3,
  );
});

test("the story preserves six chapters, complete evidence, and unique reachable anchors", () => {
  for (const prefix of ["", "en/"]) {
    const overview = readFileSync(
      new URL(`${prefix}hw02/index.html`, root),
      "utf8",
    );
    assert.match(overview, /story-cover/);
    assert.equal((overview.match(/data-story-chapter/g) || []).length, 6);
    assert.equal((overview.match(/class="story-step"/g) || []).length, 21);
    assert.equal((overview.match(/<story-scene/g) || []).length, 6);
    const html = readFileSync(
      new URL(`${prefix}hw02/index.html`, root),
      "utf8",
    );
    for (const id of ["applications", "benefits", "adoption", "boundaries"])
      assert.ok(html.includes(`id="${id}"`));
    for (const kind of [
      "industry",
      "robots",
      "medical",
      "weather",
      "discovery",
      "effects",
      "developers",
      "adoption",
      "investment",
      "enterprise",
      "energy",
      "exposure",
    ])
      assert.ok(html.includes(`data-kind="${kind}"`), kind);
    for (const c of dataset.cases) {
      assert.ok(html.includes(`data-case="${c.id}"`));
      const markup = html.match(
        new RegExp(`<article[^>]*data-case="${c.id}"[^>]*>`),
      )[0];
      assert.doesNotMatch(markup, /\shidden(?:[=\s>])/);
    }
    assert.match(html, /data-action="demo"/);
    for (const page of chapters) {
      const content = readFileSync(
        new URL(`${prefix}hw02/${page}index.html`, root),
        "utf8",
      );
      const ids = [...content.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      assert.equal(new Set(ids).size, ids.length, "IDs must be unique");
      assert.equal((content.match(/class="site-footer"/g) || []).length, 1);
      assert.ok(!content.includes('class="hw-pagination"'));
      for (const [, anchor] of content.matchAll(/href="#([^"]+)"/g))
        assert.ok(ids.includes(anchor), anchor);
    }
  }
});

test("legacy topic routes keep a localized matching-section link without JavaScript", () => {
  for (const prefix of ["", "en/"])
    for (const [page, section] of Object.entries(legacy)) {
      const html = readFileSync(
        new URL(`${prefix}hw02/${page}/index.html`, root),
        "utf8",
      );
      assert.ok(html.includes(`href="/${prefix}hw02/#${section}"`));
      assert.match(html, /data-legacy-target/);
      assert.match(html, /url.search=location.search/);
    }
});

test("research evidence and model results remain readable before JavaScript runs", () => {
  for (const prefix of ["", "en/"]) {
    const html = readFileSync(
      new URL(`${prefix}hw02/index.html`, root),
      "utf8",
    );
    for (const id of [
      "support",
      "time",
      "quality",
      "adoption-2023",
      "adoption-2024",
      "adoption-2025",
      "eu-small",
      "eu-medium",
      "eu-large",
      "energy-2025",
      "energy-2030",
      "exposure-global",
      "dev-time",
      "dev-tasks",
    ]) {
      const record = dataset.records.find((r) => r.id === id),
        source = dataset.sources.find((s) => s.id === record.source);
      assert.ok(
        html.includes(source.url.replaceAll("&", "&amp;")),
        id + " source",
      );
      assert.ok(
        html.includes(record.scope[prefix ? "en" : "zh"]),
        id + " sample",
      );
      assert.ok(
        html.includes(record.limitation[prefix ? "en" : "zh"]),
        id + " limitation",
      );
    }
    const lab = readFileSync(new URL(`${prefix}hw02/index.html`, root), "utf8");
    assert.match(lab, /data-result="baseline">18.3/);
    assert.match(lab, /data-result="assisted">15.7/);
    assert.match(lab, /data-result="saved">14.5%/);
    const sources = readFileSync(
      new URL(`${prefix}hw02/sources/index.html`, root),
      "utf8",
    );
    assert.match(sources, /<source-browser/);
    for (const source of dataset.sources)
      assert.ok(sources.includes(`id="source-${source.id}"`));
    for (const record of dataset.records)
      assert.ok(sources.includes(`id="record-${record.id}"`));
    assert.equal(
      (sources.match(/data-source-row/g) || []).length,
      dataset.sources.length,
    );
  }
});
