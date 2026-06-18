import { useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "../../api/client";
import { fetchProjects } from "../../api/projectsApi";

const STATIC_PROGRAMS = [
  {
    code: "SSCP",
    name: "Small Enterprise Technology Upgrading Program (SETUP) — Community/Cluster Support (SSCP)",
    color: "#22D3EE",
    blurb:
      "Support for community-based / cluster initiatives with tech-enabled systems and capability building.",
  },
  {
    code: "CEST",
    name: "Community Empowerment through Science and Technology (CEST)",
    color: "#FDB913",
    blurb:
      "Science and technology interventions to uplift communities through appropriate, sustainable solutions.",
  },
  {
    code: "SETUP",
    name: "Small Enterprise Technology Upgrading Program (SETUP)",
    color: "#A78BFA",
    blurb:
      "Technology upgrading assistance for MSMEs to improve productivity, quality, and competitiveness.",
  },
  {
    code: "GIA",
    name: "Grants-in-Aid (GIA)",
    color: "#34D399",
    blurb:
      "Financial support for S&T projects that enable innovation, resiliency, and inclusive development.",
  },
];

const Programs = ({ onInitialLoadComplete }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
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
        const list = await fetchProjects();
        if (!cancelled) {
          setProjects(list);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(err, "Could not load projects."));
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          notifyReady();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const programMeta = Object.fromEntries(
    STATIC_PROGRAMS.map((p) => [p.code, p])
  );

  const statusClass = (status) => {
    switch (status) {
      case "Completed":
      case "Graduated":
        return "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20";
      case "Ongoing":
        return "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20";
      case "Pipeline":
        return "bg-violet-400/10 text-violet-200 ring-1 ring-violet-400/20";
      case "Terminated":
        return "bg-rose-400/10 text-rose-200 ring-1 ring-rose-400/20";
      default:
        return "bg-white/5 text-white/80 ring-1 ring-white/10";
    }
  };

  const yearFromRecord = (proj) => {
    if (!proj.createdAt) return "—";
    const d = new Date(proj.createdAt);
    return Number.isNaN(d.getTime()) ? "—" : String(d.getFullYear());
  };

  return (
    <section
      id="assistance"
      className="relative min-h-screen w-full scroll-mt-24 overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur sm:py-14"
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(34,211,238,.20)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,.12),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-left">
            <div className="text-xs font-medium tracking-wide text-white/60">
              Programs
            </div>
            <div className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              DOST-MARINDUQUE Programs &amp; projects
            </div>
            <div className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Program descriptions below are reference material. Project cards load
              from the database (same records added in the admin area).
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <span className="relative inline-flex h-3 w-3 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inline-flex h-3 w-3 rounded-full bg-cyan-300/60 opacity-40 motion-safe:animate-ping"
              />
              <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)] motion-safe:animate-pulse" />
            </span>
            Live data
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {STATIC_PROGRAMS.map((p) => (
            <div
              key={p.code}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <div
                className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-2xl"
                style={{ background: `${p.color}33` }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold tracking-wide text-white">
                      {p.code}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-sm font-semibold text-white/90">
                      {p.name}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-white/70">
                    {p.blurb}
                  </div>
                </div>

                <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="absolute inline-flex h-3.5 w-3.5 rounded-full opacity-40 motion-safe:animate-ping"
                    style={{ backgroundColor: p.color }}
                  />
                  <span
                    className="relative h-3 w-3 rounded-full shadow-[0_0_18px_rgba(255,255,255,.12)] motion-safe:animate-pulse"
                    style={{ backgroundColor: p.color }}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="text-left text-sm font-semibold text-white/90">
            Projects
          </div>
          <div className="text-xs text-white/55">
            {loading
              ? "Loading…"
              : loadError
                ? "Could not load"
                : `${projects.length} record${projects.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {loadError ? (
          <p className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100/95">
            {loadError}
          </p>
        ) : null}

        {!loading && !loadError && projects.length === 0 ? (
          <p className="mt-4 text-sm text-white/55">
            No projects in the database yet. Add entries from the admin Programs
            page.
          </p>
        ) : null}

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!loading &&
            projects.map((proj) => {
              const meta = programMeta[proj.programType];
              const accent = meta?.color ?? "#22D3EE";
              const imgs = Array.isArray(proj.images)
                ? proj.images.filter(Boolean)
                : [];
              return (
                <article
                  key={proj.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur transition hover:border-white/20"
                >
                  <div
                    className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-60 transition group-hover:opacity-80"
                    style={{ background: `${accent}33` }}
                  />

                  {imgs[0] ? (
                    <div className="relative -mx-5 -mt-5 mb-4 h-36 overflow-hidden sm:h-40">
                      <img
                        src={imgs[0]}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {imgs.length > 1 ? (
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white/95">
                          +{imgs.length - 1} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white/85">
                          <span className="relative inline-flex h-3 w-3 items-center justify-center">
                            <span
                              aria-hidden="true"
                              className="absolute inline-flex h-3 w-3 rounded-full opacity-40 motion-safe:animate-ping"
                              style={{ backgroundColor: accent }}
                            />
                            <span
                              className="relative h-2.5 w-2.5 rounded-full motion-safe:animate-pulse"
                              style={{ backgroundColor: accent }}
                            />
                          </span>
                          {proj.programType}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(proj.projectStatus)}`}
                        >
                          {proj.projectStatus}
                        </span>
                      </div>

                      <h3 className="mt-3 text-pretty text-sm font-semibold text-white">
                        {proj.title}
                      </h3>

                      <div className="mt-2 text-xs text-white/65">
                        {proj.beneficiary} • {yearFromRecord(proj)}
                      </div>

                      {proj.address ? (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-white/50">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden="true">
                            <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.397a5 5 0 0 0-10 0c0 2.055 1.19 4.035 2.29 5.397a15.589 15.589 0 0 0 2.047 2.082 8.58 8.58 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
                          </svg>
                          <span className="line-clamp-1">{proj.address}</span>
                        </div>
                      ) : null}
                    </div>

                    {!imgs[0] ? (
                      <div
                        className="mt-1 h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5"
                        style={{
                          boxShadow: `0 0 0 1px rgba(255,255,255,.06), 0 18px 40px ${accent}22`,
                        }}
                      />
                    ) : null}
                  </div>

                  {proj.briefDescription ? (
                    <p className="relative mt-3 line-clamp-3 text-[11px] leading-relaxed text-white/60">
                      {proj.briefDescription}
                    </p>
                  ) : null}

                  {proj.description ? (
                    <p className="relative mt-2 line-clamp-4 text-[11px] leading-relaxed text-white/50">
                      {proj.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default Programs;
