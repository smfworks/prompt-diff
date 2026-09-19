import { sampleById, SAMPLES } from "./data/samples";
import { diffPrompts } from "./lib/diff";
import {
  copyImageBlob,
  copyText,
  downloadBlob,
  cardToPngBlob,
} from "./lib/exportImage";
import { formatCompactStats, formatShareText, slugify } from "./lib/share";
import type { DiffView } from "./types";
import { Actions } from "./components/Actions";
import { Composer } from "./components/Composer";
import { DiffCard } from "./components/DiffCard";
import { Header } from "./components/Header";
import { SisterStrip } from "./components/SisterStrip";
import { Toast } from "./components/Toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [title, setTitle] = useState("Untitled rewrite");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [view, setView] = useState<DiffView>("unified");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "copy" | "share" | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const loadSample = useCallback((id: string) => {
    const sample = sampleById(id);
    if (!sample) return;
    setBefore(sample.before);
    setAfter(sample.after);
    setTitle(sample.title);
    setSampleId(sample.id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sample = params.get("sample");
    const shot = params.get("shot");
    const requestedView = params.get("view");
    if (shot === "card" || shot === "og") {
      document.body.classList.add(`shot-${shot}`);
    }
    if (requestedView === "split" || requestedView === "unified") {
      setView(requestedView);
    }
    loadSample(sampleById(sample)?.id ?? SAMPLES[0].id);
  }, [loadSample]);

  const diff = useMemo(() => diffPrompts(before, after), [before, after]);
  const ready = !diff.empty;

  const onBeforeChange = useCallback((value: string) => {
    setSampleId(null);
    setTitle("Untitled rewrite");
    setBefore(value);
  }, []);

  const onAfterChange = useCallback((value: string) => {
    setSampleId(null);
    setTitle("Untitled rewrite");
    setAfter(value);
  }, []);

  const reset = useCallback(() => {
    setBefore("");
    setAfter("");
    setTitle("Untitled rewrite");
    setSampleId(null);
    showToast("Cleared.");
  }, [showToast]);

  const withFrame = useCallback(async () => {
    const node = frameRef.current;
    if (!node || diff.empty) throw new Error("Nothing to print yet.");
    node.classList.add("is-exporting");
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    try {
      return await cardToPngBlob(node);
    } finally {
      node.classList.remove("is-exporting");
    }
  }, [diff.empty]);

  const downloadPng = useCallback(async () => {
    if (!ready) return;
    setBusy("png");
    try {
      const blob = await withFrame();
      downloadBlob(blob, `prompt-diff-${slugify(title)}.png`);
      showToast("PNG downloaded.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setBusy(null);
    }
  }, [ready, showToast, title, withFrame]);

  const copyImage = useCallback(async () => {
    if (!ready) return;
    setBusy("copy");
    try {
      const blob = await withFrame();
      await copyImageBlob(blob);
      showToast("Image copied.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Copy image failed — try Download PNG.",
      );
    } finally {
      setBusy(null);
    }
  }, [ready, showToast, withFrame]);

  const copyShare = useCallback(async () => {
    if (!ready) return;
    setBusy("share");
    try {
      await copyText(formatShareText(diff, title));
      showToast("Share text copied.");
    } catch {
      showToast("Could not copy share text.");
    } finally {
      setBusy(null);
    }
  }, [diff, ready, showToast, title]);

  const live = ready ? `${title} · ${formatCompactStats(diff)}` : "Waiting for two prompts";

  return (
    <div className="page">
      <div className="ambient" aria-hidden="true" />
      <Header />
      <SisterStrip current="prompt-diff" />
      <main className="layout">
        <Composer
          before={before}
          after={after}
          sampleId={sampleId}
          view={view}
          onBeforeChange={onBeforeChange}
          onAfterChange={onAfterChange}
          onSample={loadSample}
          onView={setView}
        />
        <section className="stage">
          <div className="stage-scroll">
            <p className="sr-only">{live}</p>
            <div
              className={view === "split" ? "export-frame is-split" : "export-frame"}
              ref={frameRef}
            >
              <DiffCard diff={diff} title={title} view={view} />
            </div>
          </div>
          <p className="stage-stats">{ready ? formatCompactStats(diff) : null}</p>
          <Actions
            disabled={!ready}
            busy={busy}
            onDownloadPng={() => void downloadPng()}
            onCopyImage={() => void copyImage()}
            onCopyShare={() => void copyShare()}
            onReset={reset}
          />
        </section>
      </main>
      <footer className="site-foot">
        <p>Prompt Diff · SMF Works</p>
        <p>
          Sister apps:{" "}
          <a href="https://github.com/smfworks/paste-to-skill">Paste → Skill</a>
          {" — create · "}
          <a href="https://github.com/smfworks/skill-lint">Skill Lint</a>
          {" — grade · "}
          <a href="https://github.com/smfworks/refuse-card">Refuse Card</a>
          {" — the gate · "}
          <a href="https://github.com/smfworks/agent-receipt">Agent Receipt</a>
          {" — what ran."}
        </p>
        <p>Intelligence is abundant. Judgment is the product.</p>
        <p>
          MIT · Built by{" "}
          <a href="https://smfworks.com">SMF Works</a>
          {" · "}
          <a href="https://github.com/smfworks/prompt-diff">GitHub</a>
          {" · "}
          <a href="https://x.com/MichaelGannotti">@MichaelGannotti</a>
        </p>
        <p className="fineprint">
          No secrets, no monetization, no medical or legal advice. A shareable
          diff is not an audit, not compliance, and not a substitute for human
          review.
        </p>
      </footer>
      <Toast message={toast} />
    </div>
  );
}
