import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { createAnnouncement, updateAnnouncement } from "../../../api/announcementsApi";
import { getApiErrorMessage } from "../../../api/client";

const emptyForm = () => ({
  highlightLabel: "Today's highlight",
  title: "",
  subtitle: "",
  displayDate: "",
  badge: "",
  carouselCaption: "",
  bodyText: "",
  hashtags: "",
  ctaLabel: "",
  ctaUrl: "",
  facebookPostUrl: "",
  newImageAlts: "",
});

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30";

const labelClass = "block text-sm font-medium text-white/80";

/**
 * Add or edit a highlight announcement. Images → Supabase; fields + URLs → MongoDB.
 */
const PostModal = ({ onClose, onSaved, editingAnnouncement }) => {
  const isEdit = Boolean(editingAnnouncement?.id);
  const [form, setForm] = useState(emptyForm);
  const [keptImages, setKeptImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (editingAnnouncement) {
      const a = editingAnnouncement;
      setForm({
        highlightLabel: a.highlightLabel || "Today's highlight",
        title: a.title || "",
        subtitle: a.subtitle || "",
        displayDate: a.displayDate || "",
        badge: a.badge || "",
        carouselCaption: a.carouselCaption || "",
        bodyText: Array.isArray(a.bodyParagraphs)
          ? a.bodyParagraphs.join("\n\n")
          : "",
        hashtags: Array.isArray(a.hashtags) ? a.hashtags.join("\n") : "",
        ctaLabel: a.ctaLabel || "",
        ctaUrl: a.ctaUrl || "",
        facebookPostUrl: a.facebookPostUrl || "",
        newImageAlts: "",
      });
      setKeptImages(
        (a.images || []).map((img) => ({
          url: img.url,
          alt: img.alt || "",
        }))
      );
    } else {
      setForm(emptyForm());
      setKeptImages([]);
    }
    setNewFiles([]);
    const input = document.getElementById("post-modal-new-images");
    if (input) input.value = "";
  }, [editingAnnouncement]);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const newFileSummary = useMemo(() => {
    if (newFiles.length === 0) return "No new files";
    return `${newFiles.length} new image${newFiles.length === 1 ? "" : "s"}`;
  }, [newFiles]);

  const handleNewFiles = (e) => {
    setNewFiles(Array.from(e.target.files || []));
  };

  const removeKept = (url) => {
    setKeptImages((prev) => prev.filter((i) => i.url !== url));
  };

  const updateKeptAlt = (url, alt) => {
    setKeptImages((prev) =>
      prev.map((i) => (i.url === url ? { ...i, alt } : i))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasAnyContent =
      Boolean(form.title.trim()) ||
      Boolean(form.bodyText.trim()) ||
      Boolean(form.facebookPostUrl.trim()) ||
      keptImages.length > 0 ||
      newFiles.length > 0;
    if (!hasAnyContent) {
      toast.error("Add at least one: title, body, image, or Facebook embed/link.");
      return;
    }

    const lines = form.newImageAlts.split("\n");
    const newAltsJson = JSON.stringify(
      newFiles.map((_, i) => (lines[i] ?? "").trim())
    );

    const fd = new FormData();
    fd.append("highlightLabel", form.highlightLabel);
    fd.append("title", form.title.trim());
    fd.append("subtitle", form.subtitle);
    fd.append("displayDate", form.displayDate);
    fd.append("badge", form.badge);
    fd.append("carouselCaption", form.carouselCaption);
    fd.append("bodyText", form.bodyText);
    fd.append("hashtags", form.hashtags);
    fd.append("ctaLabel", form.ctaLabel);
    fd.append("ctaUrl", form.ctaUrl);
    fd.append("facebookPostUrl", form.facebookPostUrl);
    fd.append("imageAlts", newAltsJson);
    if (isEdit) {
      fd.append(
        "keptImagesJson",
        JSON.stringify(
          keptImages.map(({ url, alt }) => ({
            url,
            alt: String(alt ?? "").trim(),
          }))
        )
      );
    }
    newFiles.forEach((file) => fd.append("images", file));

    setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateAnnouncement(editingAnnouncement.id, fd)
        : await createAnnouncement(fd);
      toast.success(
        isEdit ? "Announcement updated." : "Announcement published."
      );
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          isEdit ? "Could not update announcement." : "Could not publish announcement."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full max-h-[min(90vh,880px)] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/98 shadow-2xl">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2
            id="post-modal-title"
            className="text-lg font-semibold text-white sm:text-xl"
          >
            {isEdit ? "Edit highlight" : "Add highlight"}
          </h2>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">
            Images go to Supabase Storage; text and image links are stored in MongoDB.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Close
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6"
      >
        <div className="space-y-5 pb-4">
          <label className={labelClass}>
            Highlight label
            <input
              type="text"
              value={form.highlightLabel}
              onChange={setField("highlightLabel")}
              className={inputClass}
              placeholder="Today's highlight"
            />
          </label>

          <label className={labelClass}>
            Title
            <input
              type="text"
              value={form.title}
              onChange={setField("title")}
              className={inputClass}
              placeholder="Headline shown under the badge"
            />
          </label>

          <label className={labelClass}>
            Subtitle
            <input
              type="text"
              value={form.subtitle}
              onChange={setField("subtitle")}
              className={inputClass}
              placeholder="Short line under the title"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Display date
              <input
                type="text"
                value={form.displayDate}
                onChange={setField("displayDate")}
                className={inputClass}
                placeholder="April 7, 2026"
              />
            </label>
            <label className={labelClass}>
              Carousel badge
              <input
                type="text"
                value={form.badge}
                onChange={setField("badge")}
                className={inputClass}
                placeholder="DOST-SEI • JLSS 2026"
              />
            </label>
          </div>

          <label className={labelClass}>
            Facebook post embed (optional)
            <textarea
              value={form.facebookPostUrl}
              onChange={setField("facebookPostUrl")}
              rows={3}
              className={inputClass}
              placeholder={'Paste Facebook URL or iframe embed code:\n<iframe src="https://www.facebook.com/plugins/post.php?href=..."></iframe>'}
            />
          </label>

          <label className={labelClass}>
            Carousel caption (over the photos)
            <input
              type="text"
              value={form.carouselCaption}
              onChange={setField("carouselCaption")}
              className={inputClass}
              placeholder="Location or short line on the gallery"
            />
          </label>

          <label className={labelClass}>
            Body
            <textarea
              value={form.bodyText}
              onChange={setField("bodyText")}
              rows={8}
              className={`${inputClass} resize-y leading-relaxed`}
              placeholder={
                "Paragraph one.\n\nParagraph two.\n\nUse a blank line between paragraphs."
              }
            />
          </label>

          <label className={labelClass}>
            Hashtags (comma or new line, # optional)
            <textarea
              value={form.hashtags}
              onChange={setField("hashtags")}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder={"DOSTMIMAROPA\ndostmarinduque"}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Button label
              <input
                type="text"
                value={form.ctaLabel}
                onChange={setField("ctaLabel")}
                className={inputClass}
                placeholder="Open JLSS portal"
              />
            </label>
            <label className={labelClass}>
              Button URL
              <input
                type="url"
                value={form.ctaUrl}
                onChange={setField("ctaUrl")}
                className={inputClass}
                placeholder="https://"
              />
            </label>
          </div>

          {isEdit && keptImages.length > 0 ? (
            <div>
              <p className={labelClass}>Current images</p>
              <p className="mt-1 text-xs text-white/45">
                Remove images you no longer want (they will be deleted from Supabase). Add
                replacements below.
              </p>
              <ul className="mt-3 space-y-3">
                {keptImages.map((img) => (
                  <li
                    key={img.url}
                    className="flex gap-3 rounded-xl border border-white/10 bg-black/25 p-3"
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-16 w-24 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        type="text"
                        value={img.alt}
                        onChange={(e) => updateKeptAlt(img.url, e.target.value)}
                        className={inputClass}
                        placeholder="Alt text"
                      />
                      <button
                        type="button"
                        onClick={() => removeKept(img.url)}
                        className="text-xs font-medium text-rose-300/90 hover:text-rose-200"
                      >
                        Remove from post
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className={labelClass}>
              {isEdit ? "Add more images (optional)" : "Images"}{" "}
              <span className="font-normal text-white/50">
                (JPEG, PNG, WebP, GIF)
              </span>
            </p>
            <p className="mt-1 text-xs text-white/45">
              {isEdit
                ? "New files are appended after the kept images in the carousel order."
                : "The first file is slide 1 in the carousel."}
            </p>
            <label
              htmlFor="post-modal-new-images"
              className="mt-2 flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-white/20 bg-black/25 px-4 py-4 transition hover:border-cyan-400/35"
            >
              <span className="text-sm text-cyan-200/90">Choose files</span>
              <span className="text-xs text-white/50">{newFileSummary}</span>
              <input
                id="post-modal-new-images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleNewFiles}
                className="sr-only"
              />
            </label>
          </div>

          <label className={labelClass}>
            Alt text for <strong className="text-white/90">new</strong> images only (one line
            per file, in order)
            <textarea
              value={form.newImageAlts}
              onChange={setField("newImageAlts")}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder={"Description for new slide 1\nDescription for new slide 2"}
            />
          </label>
        </div>

        <div className="mt-auto flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? isEdit
                ? "Saving…"
                : "Publishing…"
              : isEdit
                ? "Save changes"
                : "Publish highlight"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostModal;
