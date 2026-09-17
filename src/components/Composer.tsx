import { PASTE_AFTER, PASTE_BEFORE, SAMPLES } from "../data/samples";
import type { DiffView } from "../types";

interface ComposerProps {
  before: string;
  after: string;
  sampleId: string | null;
  view: DiffView;
  onBeforeChange: (value: string) => void;
  onAfterChange: (value: string) => void;
  onSample: (id: string) => void;
  onView: (view: DiffView) => void;
}

export function Composer({
  before,
  after,
  sampleId,
  view,
  onBeforeChange,
  onAfterChange,
  onSample,
  onView,
}: ComposerProps) {
  return (
    <section className="composer">
      <div className="composer-head">
        <h2>Before / After</h2>
        <p>Pick a sample or paste two prompts. The diff is live and stays in the browser.</p>
      </div>

      <div className="sample-row">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className={sampleId === sample.id ? "chip is-on" : "chip"}
            onClick={() => onSample(sample.id)}
          >
            <span className="chip-top">
              <strong>{sample.label}</strong>
            </span>
            <small>{sample.blurb}</small>
          </button>
        ))}
      </div>

      <div className="editors">
        <label>
          <span className="editor-label">Before · A</span>
          <textarea
            value={before}
            onChange={(event) => onBeforeChange(event.target.value)}
            placeholder={PASTE_BEFORE}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label>
          <span className="editor-label">After · B</span>
          <textarea
            value={after}
            onChange={(event) => onAfterChange(event.target.value)}
            placeholder={PASTE_AFTER}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="composer-foot">
        <div className="seg" role="group" aria-label="Diff layout">
          <button
            type="button"
            className={view === "unified" ? "is-on" : undefined}
            onClick={() => onView("unified")}
          >
            Unified
          </button>
          <button
            type="button"
            className={view === "split" ? "is-on" : undefined}
            onClick={() => onView("split")}
          >
            Side by side
          </button>
        </div>
        <span>
          {before.trim() || after.trim()
            ? `${before.length.toLocaleString()} → ${after.length.toLocaleString()} chars`
            : "Client-side only · no API"}
        </span>
      </div>

      <p className="disclaimer">
        Lab demo. Not a security audit. Judgment stays human.
      </p>
    </section>
  );
}
