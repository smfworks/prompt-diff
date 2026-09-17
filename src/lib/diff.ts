import type { DiffRow, DiffSummary, DisplayItem, PromptDiff, WordPart } from "../types.ts";

const WORD_DIFF_MAX = 180;
const DEFAULT_CONTEXT = 1;

export function estimateTokens(text: string): number {
  return Math.round(text.length / 4);
}

export function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  return text.split(/\r?\n/);
}

export function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((part) => part.length > 0);
}

function lcsBacktrack(a: string[], b: string[]): Array<"equal" | "remove" | "add"> {
  const m = a.length;
  const n = b.length;
  const rows = m + 1;
  const cols = n + 1;
  const dp = new Uint16Array(rows * cols);
  const at = (i: number, j: number) => i * cols + j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[at(i, j)] =
        a[i - 1] === b[j - 1]
          ? (dp[at(i - 1, j - 1)] + 1) as number
          : Math.max(dp[at(i - 1, j)], dp[at(i, j - 1)]);
    }
  }

  const ops: Array<"equal" | "remove" | "add"> = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      ops.push("equal");
      i--;
      j--;
    } else if (dp[at(i - 1, j)] >= dp[at(i, j - 1)]) {
      ops.push("remove");
      i--;
    } else {
      ops.push("add");
      j--;
    }
  }
  while (i > 0) {
    ops.push("remove");
    i--;
  }
  while (j > 0) {
    ops.push("add");
    j--;
  }
  ops.reverse();
  return ops;
}

function wordParts(before: string, after: string): { beforeWords: WordPart[]; afterWords: WordPart[] } {
  const a = tokenize(before);
  const b = tokenize(after);
  const ops = lcsBacktrack(a, b);
  const beforeWords: WordPart[] = [];
  const afterWords: WordPart[] = [];
  let ai = 0;
  let bi = 0;
  for (const op of ops) {
    if (op === "equal") {
      beforeWords.push({ kind: "equal", text: a[ai++] });
      afterWords.push({ kind: "equal", text: b[bi++] });
    } else if (op === "remove") {
      beforeWords.push({ kind: "remove", text: a[ai++] });
    } else {
      afterWords.push({ kind: "add", text: b[bi++] });
    }
  }
  return { beforeWords, afterWords };
}

function hashId(before: string, after: string): string {
  const source = `${before}\0${after}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `PD-${(hash >>> 0).toString(16).toUpperCase().padStart(4, "0").slice(0, 4)}`;
}

function lineRows(beforeLines: string[], afterLines: string[]): DiffRow[] {
  const ops = lcsBacktrack(beforeLines, afterLines);
  const rows: DiffRow[] = [];
  let ai = 0;
  let bi = 0;
  let i = 0;

  while (i < ops.length) {
    const op = ops[i];
    if (op === "equal") {
      const text = beforeLines[ai];
      rows.push({
        kind: "equal",
        beforeNo: ai + 1,
        afterNo: bi + 1,
        beforeText: text,
        afterText: afterLines[bi],
      });
      ai++;
      bi++;
      i++;
      continue;
    }

    const removes: number[] = [];
    const adds: number[] = [];
    while (i < ops.length && ops[i] !== "equal") {
      if (ops[i] === "remove") removes.push(ai++);
      else adds.push(bi++);
      i++;
    }

    const paired = removes.length === 1 && adds.length === 1;
    if (paired) {
      const beforeText = beforeLines[removes[0]];
      const afterText = afterLines[adds[0]];
      const useWords = beforeText.length <= WORD_DIFF_MAX && afterText.length <= WORD_DIFF_MAX;
      const words = useWords ? wordParts(beforeText, afterText) : undefined;
      rows.push({
        kind: "change",
        beforeNo: removes[0] + 1,
        afterNo: adds[0] + 1,
        beforeText,
        afterText,
        beforeWords: words?.beforeWords,
        afterWords: words?.afterWords,
      });
      continue;
    }

    for (const index of removes) {
      rows.push({
        kind: "remove",
        beforeNo: index + 1,
        afterNo: null,
        beforeText: beforeLines[index],
        afterText: "",
      });
    }
    for (const index of adds) {
      rows.push({
        kind: "add",
        beforeNo: null,
        afterNo: index + 1,
        beforeText: "",
        afterText: afterLines[index],
      });
    }
  }

  return rows;
}

export function collapseRows(rows: DiffRow[], context = DEFAULT_CONTEXT): DisplayItem[] {
  const display: DisplayItem[] = [];
  let index = 0;
  while (index < rows.length) {
    if (rows[index].kind !== "equal") {
      display.push({ type: "row", row: rows[index] });
      index++;
      continue;
    }
    let end = index;
    while (end < rows.length && rows[end].kind === "equal") end++;
    const run = end - index;
    const keepHead = context;
    const keepTail = context;
    if (run <= keepHead + keepTail + 1) {
      for (let k = index; k < end; k++) display.push({ type: "row", row: rows[k] });
    } else {
      for (let k = 0; k < keepHead; k++) display.push({ type: "row", row: rows[index + k] });
      display.push({ type: "gap", count: run - keepHead - keepTail });
      for (let k = keepTail; k > 0; k--) display.push({ type: "row", row: rows[end - k] });
    }
    index = end;
  }
  return display;
}

function summarize(before: string, after: string, rows: DiffRow[]): DiffSummary {
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  let changed = 0;
  for (const row of rows) {
    if (row.kind === "add") added++;
    else if (row.kind === "remove") removed++;
    else if (row.kind === "change") {
      added++;
      removed++;
      changed++;
    } else unchanged++;
  }
  const beforeTokens = estimateTokens(before);
  const afterTokens = estimateTokens(after);
  return {
    added,
    removed,
    unchanged,
    changed,
    beforeLines: splitLines(before).length,
    afterLines: splitLines(after).length,
    beforeChars: before.length,
    afterChars: after.length,
    beforeTokens,
    afterTokens,
    tokenDelta: afterTokens - beforeTokens,
  };
}

export function diffPrompts(before: string, after: string, context = DEFAULT_CONTEXT): PromptDiff {
  const empty = before.length === 0 && after.length === 0;
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  const rows = empty ? [] : lineRows(beforeLines, afterLines);
  const identical = !empty && before === after;
  return {
    rows,
    display: identical || empty ? rows.map((row) => ({ type: "row" as const, row })) : collapseRows(rows, context),
    summary: summarize(before, after, rows),
    identical,
    empty,
    id: empty ? "PD-0000" : hashId(before, after),
  };
}
