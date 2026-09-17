export function SisterStrip() {
  return (
    <nav className="sisters" aria-label="SMF Works viral kit">
      <a href="https://github.com/smfworks/paste-to-skill">
        <span>01</span>
        <strong>Paste → Skill</strong>
        <small>create</small>
      </a>
      <a href="https://github.com/smfworks/skill-lint">
        <span>02</span>
        <strong>Skill Lint</strong>
        <small>grade / fix</small>
      </a>
      <a href="https://github.com/smfworks/refuse-card">
        <span>03</span>
        <strong>Refuse Card</strong>
        <small>the gate</small>
      </a>
      <a href="https://github.com/smfworks/agent-receipt">
        <span>04</span>
        <strong>Agent Receipt</strong>
        <small>what ran</small>
      </a>
      <div className="sisters-current">
        <span>05</span>
        <strong>Prompt Diff</strong>
        <small>what changed</small>
      </div>
    </nav>
  );
}
