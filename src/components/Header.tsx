export function Header() {
  return (
    <header className="mast">
      <div className="mast-brand">
        <span className="mark" aria-hidden="true" />
        <div>
          <p className="eyebrow">SMF Works · Human-AI lab</p>
          <h1>Prompt Diff</h1>
        </div>
      </div>
      <p className="lede">
        Paste two prompts. Get a visual diff. Share the rewrite — not the
        secrets.
      </p>
    </header>
  );
}
