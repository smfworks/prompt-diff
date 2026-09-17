import type { DisplayItem, DiffRow, DiffView, PromptDiff, WordPart } from "../types";

interface DiffCardProps {
  diff: PromptDiff;
  title: string;
  view: DiffView;
}

function barcodeBars(id: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < 28; i++) {
    const code = id.charCodeAt(i % id.length) + i * 13;
    bars.push(1 + (code % 4));
  }
  return bars;
}

function Words({ parts, side }: { parts: WordPart[]; side: "before" | "after" }) {
  return (
    <>
      {parts.map((part, index) => {
        const hl =
          (side === "before" && part.kind === "remove") || (side === "after" && part.kind === "add");
        return (
          <span key={`${side}-${index}`} className={hl ? "w-hl" : undefined}>
            {part.text}
          </span>
        );
      })}
    </>
  );
}

function LineText({
  row,
  side,
}: {
  row: DiffRow;
  side: "before" | "after";
}) {
  const text = side === "before" ? row.beforeText : row.afterText;
  const words = side === "before" ? row.beforeWords : row.afterWords;
  if (words?.length) return <Words parts={words} side={side} />;
  return <>{text.length ? text : " "}</>;
}

function UnifiedRows({ items }: { items: DisplayItem[] }) {
  return (
    <div className="diff-body">
      {items.map((item, index) => {
        if (item.type === "gap") {
          return (
            <div key={`gap-${index}`} className="diff-gap">
              ··· {item.count} unchanged ···
            </div>
          );
        }
        const { row } = item;
        if (row.kind === "equal") {
          return (
            <div key={`eq-${index}`} className="diff-row is-eq">
              <span className="gutter"> </span>
              <span className="ln">{row.beforeNo}</span>
              <span className="text">{row.beforeText || " "}</span>
            </div>
          );
        }
        if (row.kind === "add") {
          return (
            <div key={`add-${index}`} className="diff-row is-add">
              <span className="gutter">+</span>
              <span className="ln">{row.afterNo}</span>
              <span className="text">
                <LineText row={row} side="after" />
              </span>
            </div>
          );
        }
        if (row.kind === "remove") {
          return (
            <div key={`del-${index}`} className="diff-row is-del">
              <span className="gutter">−</span>
              <span className="ln">{row.beforeNo}</span>
              <span className="text">
                <LineText row={row} side="before" />
              </span>
            </div>
          );
        }
        return (
          <div key={`ch-${index}`} className="diff-change">
            <div className="diff-row is-del">
              <span className="gutter">−</span>
              <span className="ln">{row.beforeNo}</span>
              <span className="text">
                <LineText row={row} side="before" />
              </span>
            </div>
            <div className="diff-row is-add">
              <span className="gutter">+</span>
              <span className="ln">{row.afterNo}</span>
              <span className="text">
                <LineText row={row} side="after" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SplitRows({ items }: { items: DisplayItem[] }) {
  return (
    <div className="diff-split">
      <div className="diff-col">
        <p className="r-label">Before</p>
        {items.map((item, index) => {
          if (item.type === "gap") {
            return (
              <div key={`lgap-${index}`} className="diff-gap">
                ··· {item.count} ···
              </div>
            );
          }
          const { row } = item;
          if (row.kind === "add") {
            return <div key={`lph-${index}`} className="diff-row is-ph" />;
          }
          const kind = row.kind === "equal" ? "is-eq" : "is-del";
          return (
            <div key={`l-${index}`} className={`diff-row ${kind}`}>
              <span className="gutter">{row.kind === "equal" ? " " : "−"}</span>
              <span className="ln">{row.beforeNo}</span>
              <span className="text">
                <LineText row={row} side="before" />
              </span>
            </div>
          );
        })}
      </div>
      <div className="diff-col">
        <p className="r-label">After</p>
        {items.map((item, index) => {
          if (item.type === "gap") {
            return (
              <div key={`rgap-${index}`} className="diff-gap">
                ··· {item.count} ···
              </div>
            );
          }
          const { row } = item;
          if (row.kind === "remove") {
            return <div key={`rph-${index}`} className="diff-row is-ph" />;
          }
          const kind = row.kind === "equal" ? "is-eq" : "is-add";
          return (
            <div key={`r-${index}`} className={`diff-row ${kind}`}>
              <span className="gutter">{row.kind === "equal" ? " " : "+"}</span>
              <span className="ln">{row.afterNo}</span>
              <span className="text">
                <LineText row={row} side="after" />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DiffCard({ diff, title, view }: DiffCardProps) {
  const { summary } = diff;
  const rail =
    diff.empty || diff.identical ? "is-empty" : summary.added >= summary.removed ? "is-add" : "is-del";
  const tokenSign = summary.tokenDelta > 0 ? `+${summary.tokenDelta}` : `${summary.tokenDelta}`;
  const items = diff.display.length ? diff.display : [];

  return (
    <article className={`ticket ${rail}`}>
      <span className="ticket-rail" aria-hidden="true" />
      <header className="ticket-head">
        <div>
          <p className="r-kicker">SMF Works · Prompt Diff</p>
          <h2>Prompt Diff</h2>
        </div>
        <p className="ticket-seq">{diff.id}</p>
      </header>
      <div className="perf" aria-hidden="true">
        <span />
      </div>
      <div className="ticket-body">
        <p className="r-label">Rewrite</p>
        <div className="r-hero">
          <h3>{diff.empty ? "Waiting for two prompts" : title}</h3>
        </div>
        <div className="stat-row">
          <span className="stat is-add">+{summary.added} added</span>
          <span className="stat is-del">−{summary.removed} removed</span>
          <span className="stat is-eq">={summary.unchanged} unchanged</span>
          <span className="stat is-tok">~{tokenSign} tok</span>
        </div>
        {diff.empty ? (
          <p className="r-placeholder">Paste Before and After — or load a sample — to print a card.</p>
        ) : diff.identical ? (
          <p className="r-placeholder">No changes. The prompts match line for line.</p>
        ) : view === "split" ? (
          <SplitRows items={items} />
        ) : (
          <UnifiedRows items={items} />
        )}
      </div>
      <div className="barcode" aria-hidden="true">
        {barcodeBars(diff.id).map((width, index) => (
          <i key={index} style={{ width }} />
        ))}
      </div>
      <footer className="r-foot">
        <p className="r-link">github.com/smfworks/prompt-diff</p>
        <p className="r-motto">Intelligence is abundant. Judgment is the product.</p>
      </footer>
    </article>
  );
}
