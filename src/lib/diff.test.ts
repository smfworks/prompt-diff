import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SAMPLES } from "../data/samples.ts";
import {
  collapseRows,
  diffPrompts,
  estimateTokens,
  splitLines,
  tokenize,
} from "./diff.ts";

describe("estimateTokens", () => {
  it("is chars/4 rounded", () => {
    assert.equal(estimateTokens(""), 0);
    assert.equal(estimateTokens("abcd"), 1);
    assert.equal(estimateTokens("abcde"), 1);
    assert.equal(estimateTokens("abcdef"), 2);
  });
});

describe("splitLines", () => {
  it("returns empty for empty text", () => {
    assert.deepEqual(splitLines(""), []);
  });

  it("keeps a trailing blank line", () => {
    assert.deepEqual(splitLines("a\n"), ["a", ""]);
  });
});

describe("tokenize", () => {
  it("keeps whitespace as tokens", () => {
    assert.deepEqual(tokenize("foo bar"), ["foo", " ", "bar"]);
  });
});

describe("diffPrompts", () => {
  it("caps huge pastes before LCS", () => {
    const before = `${"line\n".repeat(4_000)}unique-before`;
    const after = `${"line\n".repeat(4_000)}unique-after`;
    const diff = diffPrompts(before, after);
    assert.ok(diff.summary.beforeLines <= 2_000);
    assert.ok(diff.summary.afterLines <= 2_000);
    assert.ok(diff.summary.beforeChars <= 50_000);
  });

  it("marks empty pastes as empty", () => {
    const diff = diffPrompts("", "");
    assert.equal(diff.empty, true);
    assert.equal(diff.identical, false);
    assert.equal(diff.rows.length, 0);
    assert.equal(diff.id, "PD-0000");
  });

  it("detects identical prompts", () => {
    const diff = diffPrompts("hello\nworld", "hello\nworld");
    assert.equal(diff.identical, true);
    assert.equal(diff.summary.unchanged, 2);
    assert.equal(diff.summary.added, 0);
    assert.equal(diff.summary.removed, 0);
  });

  it("counts inserted lines as added", () => {
    const diff = diffPrompts("keep", "keep\nnew");
    assert.equal(diff.summary.added, 1);
    assert.equal(diff.summary.unchanged, 1);
    assert.equal(diff.rows[1]?.kind, "add");
    assert.equal(diff.rows[1]?.afterText, "new");
  });

  it("counts deleted lines as removed", () => {
    const diff = diffPrompts("keep\ngone", "keep");
    assert.equal(diff.summary.removed, 1);
    assert.equal(diff.rows[1]?.kind, "remove");
  });

  it("pairs a one-line rewrite as a change with word parts", () => {
    const diff = diffPrompts("You are a helpful assistant.", "You are a bounded assistant.");
    assert.equal(diff.rows.length, 1);
    assert.equal(diff.rows[0].kind, "change");
    assert.equal(diff.summary.added, 1);
    assert.equal(diff.summary.removed, 1);
    assert.equal(diff.summary.changed, 1);
    const removed = diff.rows[0].beforeWords?.filter((part) => part.kind === "remove").map((part) => part.text);
    const added = diff.rows[0].afterWords?.filter((part) => part.kind === "add").map((part) => part.text);
    assert.deepEqual(removed, ["helpful"]);
    assert.deepEqual(added, ["bounded"]);
  });

  it("does not pair multi-line replacements as a single change", () => {
    const diff = diffPrompts("a\nb", "x\ny\nz");
    assert.ok(diff.rows.every((row) => row.kind !== "change"));
    assert.equal(diff.summary.removed, 2);
    assert.equal(diff.summary.added, 3);
  });

  it("assigns a stable card id", () => {
    const a = diffPrompts("alpha", "beta");
    const b = diffPrompts("alpha", "beta");
    assert.equal(a.id, b.id);
    assert.match(a.id, /^PD-[0-9A-F]{4}$/);
  });

  it("tracks token delta via chars/4", () => {
    const before = "abcd";
    const after = "abcdefgh";
    const diff = diffPrompts(before, after);
    assert.equal(diff.summary.beforeTokens, 1);
    assert.equal(diff.summary.afterTokens, 2);
    assert.equal(diff.summary.tokenDelta, 1);
  });
});

describe("collapseRows", () => {
  it("hides a long equal run with a gap", () => {
    const diff = diffPrompts(
      ["keep", "a", "b", "c", "d", "e", "tail"].join("\n"),
      ["keep", "a", "b", "c", "d", "e", "TAIL"].join("\n"),
    );
    const display = collapseRows(diff.rows, 1);
    const gap = display.find((item) => item.type === "gap");
    assert.ok(gap && gap.type === "gap");
    assert.ok(gap.count >= 1);
  });
});

describe("samples", () => {
  it("ships four prompt pairs", () => {
    assert.equal(SAMPLES.length, 4);
  });

  it("bounded-system adds lines and tokens", () => {
    const sample = SAMPLES.find((item) => item.id === "bounded-system");
    assert.ok(sample);
    const diff = diffPrompts(sample.before, sample.after);
    assert.ok(diff.summary.added > 0);
    assert.ok(diff.summary.tokenDelta > 0);
    assert.equal(diff.empty, false);
  });

  it("safety-addendum keeps most of the original", () => {
    const sample = SAMPLES.find((item) => item.id === "safety-addendum");
    assert.ok(sample);
    const diff = diffPrompts(sample.before, sample.after);
    assert.ok(diff.summary.unchanged >= 3);
    assert.ok(diff.summary.added >= 4);
    assert.equal(diff.summary.removed, 0);
  });

  it("user rewrite is a full replace with no equals", () => {
    const sample = SAMPLES.find((item) => item.id === "user-prompt");
    assert.ok(sample);
    const diff = diffPrompts(sample.before, sample.after);
    assert.ok(diff.summary.removed >= 1);
    assert.ok(diff.summary.added >= 3);
  });
});
