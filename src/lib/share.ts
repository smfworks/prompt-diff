import type { PromptDiff } from "../types.ts";

const SHARE_URL = "https://github.com/smfworks/prompt-diff";

function sign(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function formatTokenDelta(delta: number): string {
  return `~${sign(delta)} tok`;
}

export function formatCompactStats(diff: PromptDiff): string {
  const { added, removed, unchanged, tokenDelta } = diff.summary;
  return `+${added} −${removed} =${unchanged} · ${formatTokenDelta(tokenDelta)}`;
}

export function formatShareText(diff: PromptDiff, title: string): string {
  const lines = [
    `✦ Prompt Diff · ${title}`,
    formatCompactStats(diff),
    "",
  ];

  if (diff.empty) {
    lines.push("Paste a Before and After prompt.");
  } else if (diff.identical) {
    lines.push("No changes — the prompts match.");
  } else {
    let emitted = 0;
    for (const row of diff.rows) {
      if (emitted >= 12) break;
      if (row.kind === "equal") continue;
      if (row.kind === "remove" || row.kind === "change") {
        lines.push(`- ${row.beforeText}`);
        emitted++;
      }
      if (row.kind === "add" || row.kind === "change") {
        lines.push(`+ ${row.afterText}`);
        emitted++;
      }
    }
    if (diff.rows.some((row) => row.kind !== "equal") && emitted >= 12) {
      lines.push("…");
    }
    lines.push("", "We rewrote the prompt.");
  }

  lines.push("Prompt Diff · SMF Works", SHARE_URL);
  return lines.join("\n");
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "untitled";
}
