import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SAMPLES } from "../data/samples.ts";
import { diffPrompts } from "./diff.ts";
import { formatCompactStats, formatShareText, slugify } from "./share.ts";

describe("formatCompactStats", () => {
  it("prints added / removed / unchanged and token delta", () => {
    const diff = diffPrompts("keep\nold", "keep\nnew");
    assert.equal(formatCompactStats(diff), "+1 −1 =1 · ~0 tok");
  });
});

describe("formatShareText", () => {
  it("includes the title, stats, and SMF footer", () => {
    const sample = SAMPLES[0];
    const text = formatShareText(diffPrompts(sample.before, sample.after), sample.title);
    assert.match(text, /^✦ Prompt Diff · Bounded system prompt/);
    assert.match(text, /\+\d+ −\d+ =\d+/);
    assert.match(text, /We rewrote the prompt\./);
    assert.match(text, /https:\/\/github.com\/smfworks\/prompt-diff/);
  });

  it("handles identical prompts", () => {
    const text = formatShareText(diffPrompts("same", "same"), "Untitled rewrite");
    assert.match(text, /No changes/);
  });
});

describe("slugify", () => {
  it("kebabs a title", () => {
    assert.equal(slugify("Bounded system prompt"), "bounded-system-prompt");
  });
});
