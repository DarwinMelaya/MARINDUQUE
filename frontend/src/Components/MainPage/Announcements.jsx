import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchFeaturedAnnouncement } from "../../api/announcementsApi";
import { getApiErrorMessage } from "../../api/client";

function getFacebookEmbedUrl(rawUrl) {
  const input = String(rawUrl ?? "").trim();
  if (!input) return "";
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return "";
  }
  const host = parsed.hostname.toLowerCase();
  const allowedHosts = new Set([
    "facebook.com",
    "www.facebook.com",
    "web.facebook.com",
    "m.facebook.com",
    "fb.watch",
    "www.fb.watch",
  ]);
  if (!allowedHosts.has(host)) return "";
  const clean = parsed.toString();
  const path = parsed.pathname.toLowerCase();
  const useVideoPlugin =
    path.includes("/reel/") || path.includes("/videos/") || host.includes("fb.watch");
  if (useVideoPlugin) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clean)}&show_text=true&width=500&t=0`;
  }
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(clean)}&show_text=true&width=500`;
}

function ApiArticleBody({ post }) {
  const ctaOk = post.ctaLabel?.trim() && post.ctaUrl?.trim();
  const paragraphs = Array.isArray(post.bodyParagraphs) ? post.bodyParagraphs : [];
  const hashtags = Array.isArray(post.hashtags) ? post.hashtags : [];
  return (
    <>
      {paragraphs.length > 0 ? (
        <div className="space-y-4 text-left text-sm leading-relaxed text-white/80">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </div>
      ) : null}

      {ctaOk ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={post.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-[#0054A6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,84,166,.35)] transition hover:bg-[#0A5EC0] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-[#0a1628]"
          >
            {post.ctaLabel.trim()}
          </a>
        </div>
      ) : null}

      {hashtags.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {hashtags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/65 transition hover:border-white/20 hover:text-white/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

const Announcements = ({ onInitialLoadComplete }) => {
  const [apiPost, setApiPost] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const didNotifyReadyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const notifyReady = () => {
      if (didNotifyReadyRef.current) return;
      didNotifyReadyRef.current = true;
      onInitialLoadComplete?.();
    };

    (async () => {
      try {
        const announcement = await fetchFeaturedAnnouncement();
        if (!cancelled) {
          setApiPost(announcement);
          setFetchFailed(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn(getApiErrorMessage(err, "Announcement fetch failed."));
          setApiPost(null);
          setFetchFailed(true);
        }
      } finally {
        if (!cancelled) notifyReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const post = apiPost;

  const slides = useMemo(() => {
    if (!post || !Array.isArray(post.images) || post.images.length === 0) return [];
    return post.images.map((img) => ({
      src: img.url,
      alt: img.alt?.trim() || post.title || "Announcement image",
    }));
  }, [post]);

  const highlightLabel = post?.highlightLabel || "Today's highlight";
  const title = post?.title?.trim() || "Latest DOST Marinduque announcement";
  const subtitle = post?.subtitle?.trim();
  const displayDate = post?.displayDate?.trim() || "—";
  const badge = post?.badge?.trim() || "Announcement";
  const carouselCaption = post?.carouselCaption?.trim() || "DOST Marinduque updates";
  const facebookEmbedUrl = post ? getFacebookEmbedUrl(post.facebookPostUrl) : "";

  const [slideIndex, setSlideIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    setSlideIndex((i) => (total > 0 ? Math.min(i, total - 1) : 0));
  }, [total]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setSlideIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    setSlideIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total === 0) return;
    const id = window.setInterval(goNext, 6000);
    return () => window.clearInterval(id);
  }, [goNext, total]);

  return (
    <div className="relative min-h-0 w-full overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(99,179,237,.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.18)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(253,185,19,.14),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(0,84,166,.18),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {fetchFailed ? (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100/90 sm:text-left">
            Could not load the latest highlight from the server.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FDB913]/30 bg-[#FDB913]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#FDB913] backdrop-blur">
              <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#FDB913] opacity-40 motion-safe:animate-ping"
                />
                <span className="relative h-2 w-2 rounded-full bg-[#FDB913] shadow-[0_0_14px_rgba(253,185,19,.7)]" />
              </span>
              {highlightLabel}
            </div>
            <h2 className="mt-3 text-pretty text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-white/90 bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm text-white/60">{subtitle}</p>
            ) : null}
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.55)]" />
            {displayDate}
          </div>
        </div>

        {post ? (
        <article className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl opacity-70"
            style={{ background: "rgba(34, 211, 238, 0.2)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full blur-3xl opacity-50"
            style={{ background: "rgba(253, 185, 19, 0.15)" }}
          />

          <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {total > 0 ? (
              <div
                className="group/carousel relative min-h-[220px] lg:min-h-[320px]"
                aria-roledescription="carousel"
                aria-label="Highlight photos"
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
                    style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                  >
                    {slides.map((slide) => (
                      <div
                        key={slide.src}
                        className="relative h-full min-h-[220px] w-full min-w-full shrink-0 lg:min-h-[320px]"
                      >
                        <img
                          src={slide.src}
                          alt={slide.alt}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading={slideIndex === 0 ? "eager" : "lazy"}
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1628]/95 via-[#0A2E5C]/70 to-[#0054A6]/35" />
                <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(34,211,238,.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,.2)_1px,transparent_1px)] [background-size:24px_24px]" />

                <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90 backdrop-blur sm:left-4 sm:top-4 sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.8)] motion-safe:animate-pulse" />
                  Gallery
                  <span className="text-white/50">•</span>
                  <span className="tabular-nums text-white/80">
                    {slideIndex + 1}/{total}
                  </span>
                </div>

                {total > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="pointer-events-auto absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-white/90 backdrop-blur transition hover:border-cyan-300/40 hover:bg-black/65 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50 sm:left-3 sm:h-10 sm:w-10"
                      aria-label="Previous slide"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M15 6l-6 6 6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-white/90 backdrop-blur transition hover:border-cyan-300/40 hover:bg-black/65 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50 sm:right-3 sm:h-10 sm:w-10"
                      aria-label="Next slide"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                ) : null}

                {total > 1 ? (
                  <div className="pointer-events-auto absolute bottom-14 left-0 right-0 z-20 flex justify-center gap-1.5 px-4 sm:bottom-16">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlideIndex(i)}
                        className={`h-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:ring-offset-2 focus:ring-offset-transparent ${
                          i === slideIndex
                            ? "w-6 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.5)]"
                            : "w-1.5 bg-white/35 hover:bg-white/55"
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === slideIndex ? "true" : undefined}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
                  <div className="rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200/90 backdrop-blur">
                    {badge}
                  </div>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-white/90">
                    {carouselCaption}
                  </p>
                </div>
              </div>
            ) : null}

            <div
              className={`relative p-6 sm:p-8 ${
                total > 0 ? "border-t border-white/10 lg:border-l lg:border-t-0" : ""
              }`}
            >
              <ApiArticleBody post={post} />
            </div>
          </div>
          {facebookEmbedUrl ? (
            <div className="relative border-t border-white/10 bg-black/15 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cyan-200/85">
                  Facebook post
                </p>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
                  <iframe
                    title="Embedded Facebook post"
                    src={facebookEmbedUrl}
                    width="100%"
                    height="680"
                    style={{ border: "none", overflow: "hidden" }}
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          ) : null}
        </article>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-white/65">
            No featured announcement yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
