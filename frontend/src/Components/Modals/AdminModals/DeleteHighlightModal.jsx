import { useEffect } from "react";

/**
 * Confirmation dialog before deleting a highlight (matches admin delete flow).
 */
const DeleteHighlightModal = ({
  open,
  highlightTitle,
  onCancel,
  onConfirm,
  confirming = false,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !confirming) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirming, onCancel]);

  if (!open) return null;

  const safeTitle =
    highlightTitle?.trim() || "Untitled highlight";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !confirming) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-highlight-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141018] px-6 py-6 shadow-2xl sm:px-7 sm:py-7"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-highlight-title"
          className="text-base font-medium leading-snug text-white sm:text-lg"
        >
          Delete this highlight?
        </h2>
        <p className="mt-3 text-sm text-white/90 sm:text-base">
          <span className="text-white">&quot;{safeTitle}&quot;</span>
        </p>
        <p className="mt-4 text-sm text-white/55">
          Images will be removed from storage.
        </p>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={confirming}
            onClick={onCancel}
            className="rounded-full border border-violet-900/50 bg-[#2d1f45] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#362456] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141018] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="rounded-full border border-white/25 bg-[#d4c8e8] px-6 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e2daf2] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#141018] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirming ? "Deleting…" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteHighlightModal;
