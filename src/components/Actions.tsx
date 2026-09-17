interface ActionsProps {
  disabled: boolean;
  busy: "png" | "copy" | "share" | null;
  onDownloadPng: () => void;
  onCopyImage: () => void;
  onCopyShare: () => void;
  onReset: () => void;
}

export function Actions({
  disabled,
  busy,
  onDownloadPng,
  onCopyImage,
  onCopyShare,
  onReset,
}: ActionsProps) {
  return (
    <div className="actions">
      <button className="btn btn-ember" type="button" disabled={disabled} onClick={onDownloadPng}>
        {busy === "png" ? "Printing…" : "Download PNG"}
      </button>
      <button className="btn" type="button" disabled={disabled} onClick={onCopyImage}>
        {busy === "copy" ? "Copying…" : "Copy image"}
      </button>
      <button className="btn" type="button" disabled={disabled} onClick={onCopyShare}>
        {busy === "share" ? "Copying…" : "Copy share text"}
      </button>
      <button className="btn btn-ghost" type="button" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
