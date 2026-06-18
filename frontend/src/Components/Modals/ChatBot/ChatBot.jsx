import { useEffect } from "react";

const ChatBot = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-modal-title"
        className="flex h-[min(82vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl sm:h-[min(78vh,720px)] sm:max-w-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="chatbot-modal-title"
              className="truncate text-base font-semibold text-white sm:text-lg"
            >
              ChatBot
            </h2>
            <p className="mt-0.5 text-xs text-white/55 sm:text-sm">
              Ask DOST Marinduque questions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Close
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4 sm:px-5">
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
            Chat UI goes here.
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your question…"
              className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
            <button
              type="button"
              className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-4 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
