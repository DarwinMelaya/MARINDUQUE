import React from "react";

const OrgNode = ({
  name,
  role,
  type = "permanent", // "permanent" | "cos"
  photoUrl,
  size = "md", // "sm" | "md" | "lg"
  faded = false,
}) => {
  const isVacant = name?.toLowerCase?.() === "vacant";
  const ring =
    type === "permanent"
      ? "ring-cyan-300/35 shadow-[0_18px_50px_rgba(34,211,238,.18)]"
      : "ring-white/15 shadow-[0_18px_50px_rgba(255,255,255,.08)]";

  const titleClass =
    size === "lg"
      ? "text-[12px] sm:text-[13px]"
      : size === "sm"
        ? "text-[11px]"
        : "text-[11px] sm:text-[12px]";

  const nameClass =
    size === "lg"
      ? "text-[13px] sm:text-[14px]"
      : size === "sm"
        ? "text-[12px]"
        : "text-[12px] sm:text-[13px]";

  return (
    <div
      className={[
        "group relative w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.10] to-white/[0.04] p-3 backdrop-blur",
        "ring-1",
        ring,
        faded ? "opacity-85" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -left-14 -top-14 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-[#FDB913]/10 blur-3xl" />
      </div>

      <div className="relative flex items-center gap-3">
        <div
          className={[
            "relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30",
            size === "lg" ? "sm:h-12 sm:w-12" : "",
            size === "sm" ? "h-10 w-10" : "",
          ].join(" ")}
        >
          {photoUrl ? (
            <img
              alt={name}
              src={photoUrl}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {isVacant ? (
                <div className="h-6 w-6 rounded-xl border border-dashed border-white/25 bg-white/5" />
              ) : (
                <span className="text-xs font-bold tracking-wide text-white/75">
                  {String(name || "?")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")}
                </span>
              )}
            </div>
          )}
          <span className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
        </div>

        <div className="min-w-0 text-left">
          <div className={`truncate font-semibold tracking-wide text-white ${nameClass}`}>
            {name}
          </div>
          <div className={`mt-0.5 truncate text-white/70 ${titleClass}`}>{role}</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                type === "permanent"
                  ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                  : "border-white/15 bg-white/5 text-white/70",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  type === "permanent"
                    ? "bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]"
                    : "bg-white/35",
                ].join(" ")}
              />
              {type === "permanent" ? "Permanent" : "Contract of Service"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrganizationalStructure = () => {
  // Layout uses an SVG connector layer + positioned nodes.
  // Coordinates are in the same 1000x560 viewBox space.
  const nodes = [
    {
      id: "director",
      x: 50,
      y: 8,
      w: 30,
      size: "lg",
      type: "permanent",
      name: "BERNARDO T. CARINGAL",
      role: "Chief Science Research Specialist / Provincial S&T Director",
    },
    {
      id: "supervising",
      x: 50,
      y: 24,
      w: 28,
      size: "md",
      type: "permanent",
      name: "KEITH PAOLO A. BUENAVENTURA",
      role: "Supervising Science Research Specialist",
    },
    {
      id: "senior",
      x: 25,
      y: 42,
      w: 26,
      size: "md",
      type: "permanent",
      name: "JOSEPH P. MANAOG",
      role: "Senior Science Research Specialist",
    },

    // Mid level (sample image has a mix of filled + vacant posts)
    {
      id: "srs2-vacant",
      x: 50,
      y: 59,
      w: 20,
      size: "md",
      type: "permanent",
      name: "VACANT",
      role: "Science Research Specialist II",
      faded: true,
    },
    {
      id: "admin2-vacant",
      x: 67,
      y: 59,
      w: 20,
      size: "md",
      type: "permanent",
      name: "VACANT",
      role: "Administrative Assistant II",
      faded: true,
    },
    {
      id: "ceo2",
      x: 84,
      y: 59,
      w: 20,
      size: "md",
      type: "permanent",
      name: "ALJUN N. MURILLO",
      role: "CEO II",
    },
    {
      id: "srs1-a",
      x: 14,
      y: 59,
      w: 20,
      size: "md",
      type: "permanent",
      name: "AMECA F. LINJANG",
      role: "Science Research Specialist II",
    },
    {
      id: "srs1-b",
      x: 31,
      y: 59,
      w: 20,
      size: "md",
      type: "permanent",
      name: "SANTY ANTHONY J. JALLA",
      role: "Science Research Specialist I",
    },

    // Bottom (Contract of Service)
    {
      id: "ptasst1",
      x: 9,
      y: 83,
      w: 18,
      size: "sm",
      type: "cos",
      name: "WILLIAM SHANE S. MALING",
      role: "PT Asst I",
    },
    {
      id: "ptaid5",
      x: 25,
      y: 83,
      w: 18,
      size: "sm",
      type: "cos",
      name: "BERNADETTE JOYC C. MATINIG",
      role: "PT Aide V",
    },
    {
      id: "ptaid2",
      x: 41,
      y: 83,
      w: 18,
      size: "sm",
      type: "cos",
      name: "ROGER M. RABANZO",
      role: "PT Aide II",
    },
    {
      id: "ptaid1",
      x: 59,
      y: 83,
      w: 18,
      size: "sm",
      type: "cos",
      name: "DARWIN D. MELAYA",
      role: "PT Aide I",
    },
    {
      id: "ptaid5b",
      x: 76,
      y: 83,
      w: 18,
      size: "sm",
      type: "cos",
      name: "SARAH S. MABUNGA",
      role: "PT Aide V",
    },
    {
      id: "utility",
      x: 91,
      y: 83,
      w: 18,
      size: "sm",
      type: "cos",
      name: "ROSE ANN L. NAMBIO",
      role: "Utility",
    },
  ];

  const nodeStyle = (n) => ({
    left: `${n.x}%`,
    top: `${n.y}%`,
    width: `${n.w}%`,
    transform: "translateX(-50%)",
  });

  return (
    <section
      id="organizational-structure"
      className="relative w-full overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur sm:py-14 min-h-screen"
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(34,211,238,.20)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,84,166,.18),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-left">
            <div className="text-xs font-medium tracking-wide text-white/60">
              Organizational chart
            </div>
            <div className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              DOST-MARINDUQUE Structure
            </div>
            <div className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Tech-styled org chart layout inspired by your reference image. You can
              update names, titles, and photos inside the component data.
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
            Live-ready UI
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium text-white/60">
              Legend
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]" />
                Permanent
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                <span className="h-2 w-2 rounded-full bg-white/35" />
                Contract of Service
              </span>
            </div>
          </div>

          <div className="relative mt-4 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/25">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.20),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(253,185,19,.12),transparent_45%)]" />

            <div className="relative w-full overflow-x-auto overflow-y-hidden">
              <div className="relative h-[78vh] min-h-[560px] w-full min-w-[1000px]">
              {/* Connector layer */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 1000 560"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="rgba(34,211,238,.85)" />
                    <stop offset="0.55" stopColor="rgba(0,84,166,.60)" />
                    <stop offset="1" stopColor="rgba(253,185,19,.55)" />
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.6" result="blur" />
                    <feColorMatrix
                      in="blur"
                      type="matrix"
                      values="
                        1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 14 -6"
                      result="glow"
                    />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Director -> Supervising */}
                <path
                  d="M 500 96 L 500 160"
                  stroke="url(#line)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  opacity="0.9"
                />

                {/* Supervising -> split */}
                <path
                  d="M 500 244 L 500 290 L 250 290 L 250 332"
                  stroke="url(#line)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  opacity="0.9"
                />
                <path
                  d="M 500 290 L 840 290 L 840 332"
                  stroke="url(#line)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  opacity="0.85"
                />

                {/* Senior -> left mid pair */}
                <path
                  d="M 250 410 L 250 446 L 145 446 L 145 476"
                  stroke="url(#line)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  opacity="0.85"
                />
                <path
                  d="M 250 446 L 320 446 L 320 476"
                  stroke="url(#line)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  opacity="0.85"
                />

                {/* Supervising -> mid vacant + admin + ceo */}
                <path
                  d="M 500 332 L 500 476"
                  stroke="rgba(34,211,238,.40)"
                  strokeDasharray="7 6"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.8"
                />
                <path
                  d="M 840 410 L 840 446 L 670 446 L 670 476"
                  stroke="url(#line)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  opacity="0.8"
                />
                <path
                  d="M 840 446 L 840 476"
                  stroke="url(#line)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  opacity="0.8"
                />

                {/* Bottom COS connectors (from left-mid to first three) */}
                <path
                  d="M 145 520 L 145 540 L 90 540 L 90 560"
                  stroke="rgba(255,255,255,.22)"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.9"
                />
                <path
                  d="M 145 540 L 250 540 L 250 560"
                  stroke="rgba(255,255,255,.22)"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.9"
                />
                <path
                  d="M 145 540 L 410 540 L 410 560"
                  stroke="rgba(255,255,255,.22)"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.85"
                />

                {/* Bottom COS connectors (from admin vacant to darwin + sarah) */}
                <path
                  d="M 670 520 L 670 540 L 590 540 L 590 560"
                  stroke="rgba(255,255,255,.22)"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.85"
                />
                <path
                  d="M 670 540 L 760 540 L 760 560"
                  stroke="rgba(255,255,255,.22)"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.85"
                />

                {/* Bottom COS connectors (from CEO to utility) */}
                <path
                  d="M 840 520 L 840 540 L 910 540 L 910 560"
                  stroke="rgba(255,255,255,.22)"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.85"
                />
              </svg>

              {/* Node cards */}
              {nodes.map((n) => (
                <div
                  key={n.id}
                  className="absolute"
                  style={nodeStyle(n)}
                >
                  <OrgNode
                    name={n.name}
                    role={n.role}
                    type={n.type}
                    photoUrl={n.photoUrl}
                    size={n.size}
                    faded={n.faded}
                  />
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrganizationalStructure;
