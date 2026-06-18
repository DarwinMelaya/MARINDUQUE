import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";

import { fetchProjects } from "../../api/projectsApi";
import { useGeolocation } from "../../Hooks/useGeolocation";
import { getGoogleMapsDirectionsUrl } from "../../utils/googleMaps";
import {
  PROGRAM_ORDER,
  projectHasMapCoordinates,
  projectsToMapSites,
  countMapSitesByProgramType,
} from "../../utils/projectSites";
import {
  PROGRAM_STYLES,
  createProgramDivIcon,
  fixLeafletDefaultIcons,
} from "../../Components/Map/programMarkers";
import MapUserLocation from "../../Components/Map/MapUserLocation";

const PROGRAM_TYPES = ["ALL", ...PROGRAM_ORDER];
const STATUSES      = ["ALL", "Ongoing", "Graduated", "Terminated"];

const PSTO = {
  id: "psto-office",
  name: "PSTO-Marinduque Office",
  coordinates: [13.440439852331924, 121.82847833221463],
};

const CENTER = L.latLng(13.4463, 122.0837);
const BOUNDS = L.latLngBounds(L.latLng(13.12, 121.8), L.latLng(13.57, 122.4));

// ── helpers ───────────────────────────────────────────────────────────────────
function MapAutoResize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize({ animate: false }), 120);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function statusBadgeClass(s) {
  if (s === "Ongoing")    return "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/25";
  if (s === "Graduated")  return "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25";
  if (s === "Terminated") return "bg-rose-400/15 text-rose-200 ring-1 ring-rose-400/25";
  return "bg-white/10 text-white/70 ring-1 ring-white/15";
}

// ── Image carousel (used inside the detail panel) ────────────────────────────
function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const imgs = Array.isArray(images) ? images.filter(Boolean) : [];
  if (imgs.length === 0) return null;

  const prev = (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + imgs.length) % imgs.length); };
  const next = (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % imgs.length); };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/40">
      {/* main image */}
      <div className="relative aspect-video w-full">
        <img
          key={imgs[idx]}
          src={imgs[idx]}
          alt={`Project photo ${idx + 1} of ${imgs.length}`}
          className="h-full w-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
        {/* counter */}
        <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
          {idx + 1} / {imgs.length}
        </span>
      </div>

      {/* nav buttons — only shown when multiple images */}
      {imgs.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* dot indicators */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`h-1.5 rounded-full transition-all focus:outline-none ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Detail panel (slide-up on mobile, side panel on desktop) ─────────────────
function DetailPanel({ site, userLocation, onClose }) {
  if (!site) return null;
  const style = PROGRAM_STYLES[site.program] ?? PROGRAM_STYLES.SSCP;
  const accent = style.color;

  return (
    <>
      {/* mobile backdrop */}
      <div
        className="fixed inset-0 z-[700] bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden
      />

      {/* panel */}
      <div className="
        fixed bottom-0 left-0 right-0 z-[800] max-h-[85vh] overflow-y-auto
        rounded-t-2xl border-t border-white/10 bg-slate-900
        md:absolute md:bottom-auto md:right-3 md:top-3 md:left-auto md:z-[600]
        md:w-80 md:rounded-2xl md:border md:shadow-2xl
        animate-[slideUp_0.25s_ease-out]
      ">
        {/* close bar — always visible at the top, never overlaps the image */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: (PROGRAM_STYLES[site.program] ?? PROGRAM_STYLES.SSCP).color }}
            />
            <span className="text-xs font-semibold text-white/80">{site.program}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
            Close
          </button>
        </div>

        {/* image carousel */}
        <div className="px-0">
          <ImageCarousel images={site.images} />
        </div>

        {/* info */}
        <div className="px-4 pb-5 pt-3">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}20` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
              {site.program}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(site.status)}`}>
              {site.status}
            </span>
          </div>

          <h3 className="mt-2 text-sm font-semibold leading-snug text-white">{site.name}</h3>
          <p className="mt-1 text-xs text-white/55">{site.municipality}</p>

          {/* address */}
          {site.address ? (
            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="mt-px h-3 w-3 shrink-0" aria-hidden>
                <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.397a5 5 0 0 0-10 0c0 2.055 1.19 4.035 2.29 5.397a15.589 15.589 0 0 0 2.047 2.082 8.58 8.58 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
              </svg>
              <span>{site.address}</span>
            </div>
          ) : null}

          {/* funding */}
          {(site.amountOfAssistance || site.counterpartName) ? (() => {
            const parsePeso = (v) => { const n = Number(String(v ?? "").replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };
            const dost  = parsePeso(site.amountOfAssistance);
            const cp    = parsePeso(site.counterpartAmount);
            const total = dost + cp;
            return (
              <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Funding</p>
                {site.amountOfAssistance ? (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white/55">DOST-MIMAROPA</span>
                    <span className="font-semibold text-white/85">₱{site.amountOfAssistance}</span>
                  </div>
                ) : null}
                {site.counterpartName ? (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-white/55">{site.counterpartName}</span>
                    <span className="shrink-0 font-semibold text-white/85">
                      {site.counterpartAmount ? `₱${site.counterpartAmount}` : "—"}
                    </span>
                  </div>
                ) : null}
                {total > 0 ? (
                  <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-1.5 text-xs">
                    <span className="font-semibold text-white/65">Total</span>
                    <span className="font-bold text-white">₱{total.toLocaleString("en-PH")}</span>
                  </div>
                ) : null}
              </div>
            );
          })() : null}

          {site.description && (
            <p className="mt-3 text-xs leading-relaxed text-white/65">{site.description}</p>
          )}

          <a
            href={getGoogleMapsDirectionsUrl(
              { lat: site.coordinates[0], lng: site.coordinates[1] },
              userLocation
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0054A6] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A5EC0]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
            </svg>
            Get Directions
          </a>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const MapView = () => {
  const geo = useGeolocation();
  const userLocation =
    geo.lat != null && geo.lng != null && !Number.isNaN(geo.lat)
      ? { lat: geo.lat, lng: geo.lng, accuracy: geo.accuracy }
      : null;

  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch]           = useState("");
  const [program, setProgram]         = useState("ALL");
  const [status, setStatus]           = useState("ALL");
  const [pinnedOnly, setPinnedOnly]   = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [followLocation, setFollowLocation] = useState(false);

  // selected site for the detail panel
  const [activeSite, setActiveSite] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => { fixLeafletDefaultIcons(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProjects();
        if (!cancelled) { setProjects(list); setLoadError(null); }
      } catch (err) {
        if (!cancelled) setLoadError(err?.message ?? "Could not load projects.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (pinnedOnly && !projectHasMapCoordinates(p)) return false;
      if (program !== "ALL" && p.programType !== program) return false;
      if (status  !== "ALL" && p.projectStatus !== status) return false;
      if (!q) return true;
      return [p.title, p.beneficiary, p.briefDescription, p.description]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [projects, search, program, status, pinnedOnly]);

  const sites  = useMemo(() => projectsToMapSites(filtered), [filtered]);
  const counts = useMemo(() => countMapSitesByProgramType(filtered), [filtered]);
  const activeFilters = (program !== "ALL" ? 1 : 0) + (status !== "ALL" ? 1 : 0)
    + (search.trim() ? 1 : 0) + (!pinnedOnly ? 1 : 0);

  const resetFilters = () => { setSearch(""); setProgram("ALL"); setStatus("ALL"); setPinnedOnly(true); };

  const openSite = (site) => {
    setActiveSite(site);
    mapRef.current?.flyTo(site.coordinates, 14, { animate: true, duration: 0.7 });
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-950 text-white">

      {/* top nav */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium text-white/55 transition hover:text-white/90">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Back
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm font-semibold text-white">DOST Map Projects</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSidebarOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 9 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L3.659 6.22A2.25 2.25 0 0 1 3 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
            </svg>
            Filters{activeFilters > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400/20 px-1 text-[10px] font-bold text-cyan-200 ring-1 ring-cyan-400/30">{activeFilters}</span>
            )}
          </button>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 md:inline-flex">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-cyan-300/60 opacity-50 motion-safe:animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.7)]" />
            </span>
            {loading ? "Loading…" : `${sites.length} site${sites.length === 1 ? "" : "s"} on map`}
          </div>
        </div>
      </header>

      {/* body */}
      <div className="flex min-h-0 flex-1">

        {/* sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[900] flex w-72 flex-col border-r border-white/10 bg-slate-950/98 backdrop-blur transition-transform duration-300
          md:relative md:inset-auto md:z-auto md:translate-x-0 md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white/90">Filters</span>
            <div className="flex items-center gap-2">
              {activeFilters > 0 && (
                <button type="button" onClick={resetFilters}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10">Reset</button>
              )}
              <button type="button" onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/60 transition hover:bg-white/10 md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 px-4 py-4">
            {/* search */}
            <div>
              <label htmlFor="mv-search" className="mb-1.5 block text-xs font-semibold text-white/60">Search</label>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden>
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input id="mv-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, beneficiary…"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-8 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25" />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 hover:text-white/80">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* program pills */}
            <div>
              <p className="mb-2 text-xs font-semibold text-white/60">Program type</p>
              <div className="flex flex-wrap gap-2">
                {PROGRAM_TYPES.map((t) => {
                  const st = PROGRAM_STYLES[t];
                  const active = program === t;
                  return (
                    <button key={t} type="button" onClick={() => setProgram(t)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60
                        ${active ? "border-white/30 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"}`}
                      style={active && st ? { borderColor: `${st.color}55`, backgroundColor: `${st.color}20` } : {}}>
                      {t === "ALL" ? "All" : t}
                      {t !== "ALL" && <span className="ml-1.5 tabular-nums text-[10px] text-white/50">{counts[t] ?? 0}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* status */}
            <div>
              <p className="mb-2 text-xs font-semibold text-white/60">Status</p>
              <div className="flex flex-col gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60
                      ${status === s ? "border-white/20 bg-white/10 text-white" : "border-white/[0.07] bg-transparent text-white/55 hover:bg-white/5 hover:text-white/80"}`}>
                    <span className={`h-2 w-2 rounded-full ${s==="Ongoing"?"bg-cyan-400":s==="Graduated"?"bg-emerald-400":s==="Terminated"?"bg-rose-400":"bg-white/40"}`} />
                    {s === "ALL" ? "All statuses" : s}
                  </button>
                ))}
              </div>
            </div>

            {/* mapped only toggle */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-white/80">Mapped only</p>
                <p className="text-[11px] text-white/45">Show only pinned projects</p>
              </div>
              <button type="button" onClick={() => setPinnedOnly((v) => !v)} role="switch" aria-checked={pinnedOnly}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${pinnedOnly ? "bg-cyan-500" : "bg-white/20"}`}>
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${pinnedOnly ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          {/* project list */}
          <div className="flex shrink-0 flex-col border-t border-white/10">
            <div className="flex items-center justify-between px-4 py-2.5">
              <p className="text-xs font-semibold text-white/60">
                {loading ? "Loading…" : `${filtered.length} project${filtered.length === 1 ? "" : "s"}`}
              </p>
              {loadError && <p className="text-[11px] text-rose-300/90">{loadError}</p>}
            </div>
            <ul className="max-h-52 overflow-y-auto divide-y divide-white/[0.06] md:max-h-[calc(100vh-460px)]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="animate-pulse px-4 py-3">
                    <div className="h-3 w-3/4 rounded bg-white/10" />
                    <div className="mt-2 h-2.5 w-1/2 rounded bg-white/[0.06]" />
                  </li>
                ))
              ) : filtered.length === 0 ? (
                <li className="px-4 py-4 text-sm text-white/45">No projects match.</li>
              ) : (
                filtered.map((p) => {
                  const st = PROGRAM_STYLES[p.programType];
                  const hasPin = projectHasMapCoordinates(p);
                  const site = hasPin ? sites.find((s) => s.id === p.id) : null;
                  return (
                    <li key={p.id}>
                      <button type="button" disabled={!hasPin}
                        onClick={() => site && openSite(site)}
                        className={`w-full px-4 py-3 text-left transition
                          ${activeSite?.id === p.id ? "bg-white/10" : "hover:bg-white/[0.05]"}
                          ${!hasPin ? "cursor-default opacity-50" : "cursor-pointer"}`}>
                        <div className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: st?.color ?? "#94a3b8", boxShadow: `0 0 8px ${st?.color ?? "#94a3b8"}88` }} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-white/90">{p.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-white/50">{p.beneficiary}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70">{p.programType}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(p.projectStatus)}`}>{p.projectStatus}</span>
                              {!hasPin && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200/80">No pin</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-[800] bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}

        {/* map */}
        <div className="relative min-h-0 flex-1">
          <MapContainer center={CENTER} zoom={11} minZoom={9} maxZoom={18}
            scrollWheelZoom attributionControl={false} className="h-full w-full" ref={mapRef}
            whenReady={(e) => {
              // Stop following when user manually drags the map
              e.target.on("dragstart", () => setFollowLocation(false));
            }}>
            <MapAutoResize />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" subdomains="abcd" />
            <MapUserLocation position={userLocation} bounds={BOUNDS} follow={followLocation} />

            {/* PSTO */}
            <Marker position={PSTO.coordinates} icon={createProgramDivIcon({ label: "PSTO", color: "#F59E0B" })}
              eventHandlers={{ click: () => setActiveSite({ id: PSTO.id, name: PSTO.name, program: "PSTO", municipality: "Marinduque", status: "—", description: "Provincial Science and Technology Office", images: [], coordinates: PSTO.coordinates }) }}>
              <Tooltip direction="top" offset={[0,-6]} opacity={1}>
                <span style={{ fontWeight:800 }}>PSTO</span> <span style={{ opacity:0.8 }}>• {PSTO.name}</span>
              </Tooltip>
            </Marker>

            {/* project markers */}
            {sites.map((site) => {
              const st = PROGRAM_STYLES[site.program] ?? PROGRAM_STYLES.SSCP;
              return (
                <Marker key={site.id} position={site.coordinates}
                  icon={createProgramDivIcon({ label: site.program, color: st.color })}
                  eventHandlers={{ click: () => openSite(site) }}>
                  <Tooltip direction="top" offset={[0,-6]} opacity={1}>
                    <span style={{ fontWeight:700 }}>{site.program}</span>{" "}
                    <span style={{ opacity:0.8 }}>• {site.name}</span>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>

          {/* detail panel rendered outside Leaflet */}
          <DetailPanel site={activeSite} userLocation={userLocation} onClose={() => setActiveSite(null)} />

          {/* ── Location button (bottom-right) ── */}
          <div className="absolute bottom-10 right-3 z-[500] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (!userLocation) return;
                if (!followLocation) {
                  // First press: fly to location and enable follow
                  mapRef.current?.flyTo(
                    [userLocation.lat, userLocation.lng],
                    Math.max(mapRef.current.getZoom(), 15),
                    { animate: true, duration: 0.7 }
                  );
                  setFollowLocation(true);
                } else {
                  // Second press: just pan once, keep follow on
                  mapRef.current?.panTo(
                    [userLocation.lat, userLocation.lng],
                    { animate: true, duration: 0.4 }
                  );
                }
              }}
              disabled={!userLocation}
              title={
                geo.loading
                  ? "Getting your location…"
                  : geo.error
                  ? geo.error
                  : followLocation
                  ? "Following your location — tap to re-centre"
                  : "Centre on my location"
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60
                ${followLocation
                  ? "border-sky-400/60 bg-sky-500 text-white shadow-sky-500/40 hover:bg-sky-400"
                  : "border-white/15 bg-slate-900/90 text-white/80 hover:bg-slate-800 hover:text-white"}
                disabled:cursor-not-allowed disabled:opacity-40`}
              aria-pressed={followLocation}
              aria-label="Centre on my location"
            >
              {geo.loading ? (
                /* spinner */
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                /* location arrow icon */
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* follow indicator pill */}
            {followLocation && userLocation ? (
              <div className="flex items-center gap-1.5 self-end rounded-full border border-sky-400/40 bg-sky-500/20 px-2.5 py-1 text-[10px] font-semibold text-sky-200 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,.8)] motion-safe:animate-pulse" />
                Live
              </div>
            ) : null}
          </div>

          {/* legend */}
          <div className="pointer-events-none absolute left-3 top-3 z-[500] hidden sm:block">
            <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/60 p-3 text-xs text-white/85 backdrop-blur">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/60">Legend</p>
              <div className="grid gap-1.5">
                {PROGRAM_ORDER.map((key) => {
                  const v = PROGRAM_STYLES[key];
                  const n = counts[key] ?? 0;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="relative inline-flex h-3 w-3 shrink-0">
                        <span className="absolute inset-0 rounded-full opacity-35 motion-safe:animate-ping" style={{ backgroundColor: v.color }} />
                        <span className="relative h-3 w-3 rounded-full motion-safe:animate-pulse" style={{ backgroundColor: v.color }} />
                      </span>
                      <span className="font-semibold text-white/85">{v.label}</span>
                      <span className="text-white/40">–</span>
                      <span className="tabular-nums text-white/65">{n} site{n===1?"":"s"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
