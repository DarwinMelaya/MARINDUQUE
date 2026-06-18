import { useEffect, useMemo, useState, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import { fetchProjects } from "../../api/projectsApi";
import { fetchCoralReefs } from "../../api/coralReefsApi";
import { useGeolocation } from "../../Hooks/useGeolocation";
import { getGoogleMapsDirectionsUrl } from "../../utils/googleMaps";
import {
  PROGRAM_ORDER,
  countMapSitesByProgramType,
  projectHasMapCoordinates,
  projectsToMapSites,
} from "../../utils/projectSites";
import CoralReefMap from "../Admin/CoralReefMap";
import MapUserLocation from "../Map/MapUserLocation";
import {
  PROGRAM_STYLES,
  createProgramDivIcon,
  fixLeafletDefaultIcons,
} from "../Map/programMarkers";

const PSTO_OFFICE_SITE = {
  id: "psto-marinduque-office",
  name: "PSTO-Marinduque Office",
  coordinates: [13.440439852331924, 121.82847833221463],
};

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    null
  );
}

/** Leaflet must recalc size after the map container enters/exits fullscreen. */
function MapInvalidateOnFullscreen() {
  const map = useMap();
  useEffect(() => {
    const fix = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
    };
    document.addEventListener("fullscreenchange", fix);
    document.addEventListener("webkitfullscreenchange", fix);
    return () => {
      document.removeEventListener("fullscreenchange", fix);
      document.removeEventListener("webkitfullscreenchange", fix);
    };
  }, [map]);
  return null;
}

const Map = ({ onInitialLoadComplete }) => {
  const rootRef = useRef(null);
  const didNotifyReadyRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapView, setMapView] = useState("PROGRAMS"); // PROGRAMS | CORAL_REEFS
  const geo = useGeolocation();
  const userLocation =
    geo.lat != null &&
    geo.lng != null &&
    !Number.isNaN(geo.lat) &&
    !Number.isNaN(geo.lng)
      ? {
          lat: geo.lat,
          lng: geo.lng,
          accuracy: geo.accuracy,
        }
      : null;

  const [projects, setProjects] = useState([]);
  const [coralRecords, setCoralRecords] = useState([]);
  const [coralStructureFilter, setCoralStructureFilter] = useState("ALL");
  const [coralLoadedOnce, setCoralLoadedOnce] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    program: "ALL",
    municipality: "ALL",
    status: "ALL",
    pinnedOnly: true,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (String(filters.q || "").trim()) n += 1;
    if (filters.program !== "ALL") n += 1;
    if (filters.municipality !== "ALL") n += 1;
    if (filters.status !== "ALL") n += 1;
    if (!filters.pinnedOnly) n += 1; // toggled away from default
    return n;
  }, [filters]);

  const programOptions = useMemo(() => {
    const set = new Set();
    for (const p of projects) {
      if (p?.programType) set.add(p.programType);
    }
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [projects]);

  const municipalityOptions = useMemo(() => {
    const set = new Set();
    for (const p of projects) {
      const v = p?.beneficiary;
      if (v && String(v).trim()) set.add(String(v).trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    for (const p of projects) {
      const v = p?.projectStatus;
      if (v && String(v).trim()) set.add(String(v).trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = String(filters.q || "").trim().toLowerCase();
    return projects.filter((p) => {
      if (filters.pinnedOnly && !projectHasMapCoordinates(p)) return false;
      if (filters.program !== "ALL" && p?.programType !== filters.program)
        return false;
      if (
        filters.municipality !== "ALL" &&
        String(p?.beneficiary ?? "").trim() !== filters.municipality
      )
        return false;
      if (
        filters.status !== "ALL" &&
        String(p?.projectStatus ?? "").trim() !== filters.status
      )
        return false;
      if (!q) return true;
      const hay = [
        p?.title,
        p?.beneficiary,
        p?.projectStatus,
        p?.briefDescription,
        p?.programType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projects, filters]);

  const programSites = useMemo(
    () => projectsToMapSites(filteredProjects),
    [filteredProjects]
  );
  const mapCountsByProgram = useMemo(
    () => countMapSitesByProgramType(filteredProjects),
    [filteredProjects]
  );
  // Marinduque (approximate) focus area
  const bounds = useMemo(
    () =>
      L.latLngBounds(
        L.latLng(13.12, 121.80), // SW
        L.latLng(13.57, 122.40) // NE
      ),
    []
  );

  // Boac (provincial capital) as focal point
  const center = useMemo(() => L.latLng(13.4463, 122.0837), []);
  const isCoralView = mapView === "CORAL_REEFS";
  const filteredCoralRecords = useMemo(() => {
    if (coralStructureFilter === "ALL") return coralRecords;
    return coralRecords.filter(
      (record) => (record?.reefStructure || "CNU") === coralStructureFilter
    );
  }, [coralRecords, coralStructureFilter]);

  useEffect(() => {
    let cancelled = false;
    const notifyReady = () => {
      if (didNotifyReadyRef.current) return;
      didNotifyReadyRef.current = true;
      onInitialLoadComplete?.();
    };

    (async () => {
      try {
        const list = await fetchProjects({ view: "map", pinnedOnly: true });
        if (!cancelled) setProjects(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) notifyReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mapView !== "CORAL_REEFS") return;
    if (coralLoadedOnce) return;

    let cancelled = false;
    (async () => {
      try {
        const list = await fetchCoralReefs();
        if (!cancelled) setCoralRecords(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setCoralRecords([]);
      } finally {
        if (!cancelled) setCoralLoadedOnce(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapView, coralLoadedOnce]);

  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  useEffect(() => {
    const sync = () => {
      const el = rootRef.current;
      const fsEl = getFullscreenElement();
      setIsFullscreen(Boolean(el && fsEl === el));
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (getFullscreenElement()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen)
          await document.webkitExitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch {
      // Denied or unsupported
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full overflow-hidden border-y border-white/10 bg-black/40 backdrop-blur ${
        isFullscreen ? "min-h-screen h-screen" : "min-h-screen"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isCoralView
            ? "bg-[radial-gradient(ellipse_at_top,rgba(251,113,133,.22),transparent_55%)]"
            : "bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.18),transparent_55%)]"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(99,179,237,.30)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.20)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="text-left">
          <div className="text-xs font-medium tracking-wide text-white/60">
            {isCoralView ? "Coral Intelligence Map" : "Focus Map"}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-white">
            {isCoralView
              ? "Marinduque Reef Watch"
              : "Marinduque, Philippines"}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold text-white/85 sm:h-11 sm:text-sm"
            role="tablist"
            aria-label="Map view"
          >
            <button
              type="button"
              onClick={() => {
                setMapView("PROGRAMS");
                setFiltersOpen(false);
                setCoralStructureFilter("ALL");
              }}
              className={`h-8 rounded-full px-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:h-9 sm:px-4 ${
                mapView === "PROGRAMS"
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10"
              }`}
              role="tab"
              aria-selected={mapView === "PROGRAMS"}
            >
              Programs
            </button>
            <button
              type="button"
              onClick={() => {
                setMapView("CORAL_REEFS");
                setFiltersOpen(false);
              }}
              className={`h-8 rounded-full px-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:h-9 sm:px-4 ${
                mapView === "CORAL_REEFS"
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10"
              }`}
              role="tab"
              aria-selected={mapView === "CORAL_REEFS"}
            >
              Coral reefs
            </button>
          </div>

          {mapView === "PROGRAMS" ? (
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:h-11 sm:px-4 sm:text-sm"
              aria-expanded={filtersOpen}
              aria-controls="map-filters-panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M3 5.25A.75.75 0 0 1 3.75 4.5h16.5a.75.75 0 0 1 .53 1.28l-6.28 6.28v6.19a.75.75 0 0 1-1.06.67l-3-1.5a.75.75 0 0 1-.41-.67v-4.69L3.22 5.78A.75.75 0 0 1 3 5.25Z"
                  clipRule="evenodd"
                />
              </svg>
              Filters
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400/15 px-1.5 text-[11px] font-bold text-cyan-100 ring-1 ring-cyan-400/25">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          ) : null}

          {mapView === "CORAL_REEFS" ? (
            <select
              value={coralStructureFilter}
              onChange={(e) => setCoralStructureFilter(e.target.value)}
              className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:h-11 sm:text-sm"
              aria-label="Filter coral reefs by structure"
            >
              <option value="ALL" className="bg-slate-900">
                All structures
              </option>
              <option value="CNU" className="bg-slate-900">
                CNU
              </option>
              <option value="Reefblocks" className="bg-slate-900">
                Reefblocks
              </option>
            </select>
          ) : null}

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:h-11 sm:px-4 sm:text-sm"
            aria-pressed={isFullscreen}
            title={
              isFullscreen
                ? "Exit fullscreen"
                : mapView === "CORAL_REEFS"
                  ? "View coral reefs fullscreen"
                  : "View map fullscreen"
            }
            aria-label={
              isFullscreen
                ? "Exit fullscreen"
                : mapView === "CORAL_REEFS"
                  ? "View coral reefs fullscreen"
                  : "View map fullscreen"
            }
          >
            {isFullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit" : "Fullscreen"}
            </span>
          </button>

          <div className="flex flex-col items-end gap-1">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex ${
                isCoralView
                  ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
                  : "border-white/10 bg-white/5 text-white/80"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isCoralView
                    ? "bg-rose-300 shadow-[0_0_18px_rgba(251,113,133,.75)]"
                    : "bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]"
                }`}
              />
              {mapView === "PROGRAMS"
                ? `${programSites.length} site${programSites.length === 1 ? "" : "s"}`
                : `${filteredCoralRecords.length} reef${
                    filteredCoralRecords.length === 1 ? "" : "s"
                  }`}
            </div>
            <div className="max-w-[min(100vw-2rem,240px)] text-right text-[10px] leading-tight text-white/50">
              {geo.loading ? (
                <span className="text-sky-300/90">Finding your location…</span>
              ) : geo.error ? (
                <span title={geo.error}>Location: {geo.error}</span>
              ) : userLocation ? (
                <span className="text-emerald-300/90">
                  Your location is on the map
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {filtersOpen && mapView === "PROGRAMS" ? (
        <div className="relative px-4 pb-3 sm:px-6">
          <div
            id="map-filters-panel"
            className="grid gap-2 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur sm:grid-cols-[1.2fr_.7fr_.7fr_.7fr_auto_auto] sm:items-center sm:gap-3 sm:px-4 sm:py-3"
          >
          <label className="sr-only" htmlFor="map-filter-q">
            Search projects
          </label>
          <input
            id="map-filter-q"
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, q: e.target.value }))
            }
            placeholder="Search title, beneficiary, status…"
            className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          />

          <select
            value={filters.program}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, program: e.target.value }))
            }
            className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            aria-label="Filter by program"
          >
            <option value="ALL">All programs</option>
            {programOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filters.municipality}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, municipality: e.target.value }))
            }
            className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            aria-label="Filter by beneficiary"
          >
            <option value="ALL">All beneficiaries</option>
            {municipalityOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            aria-label="Filter by status"
          >
            <option value="ALL">All status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              setFilters((prev) => ({ ...prev, pinnedOnly: !prev.pinnedOnly }))
            }
            className={`h-11 w-full rounded-xl border px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:w-auto ${
              filters.pinnedOnly
                ? "border-cyan-400/35 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15"
                : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
            }`}
            aria-pressed={filters.pinnedOnly}
            title="Show only projects with valid map coordinates"
          >
            Pins only
          </button>

          <button
            type="button"
            onClick={() =>
              setFilters({
                q: "",
                program: "ALL",
                municipality: "ALL",
                status: "ALL",
                pinnedOnly: true,
              })
            }
            className="h-11 w-full rounded-xl border border-white/15 bg-transparent px-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:w-auto"
          >
            Reset
          </button>
          </div>
        </div>
      ) : null}

      <div className="relative h-[calc(100vh-56px)] min-h-[520px] w-full">
        {mapView === "PROGRAMS" ? (
          <MapContainer
            center={center}
            zoom={11}
            minZoom={2}
            maxZoom={18}
            scrollWheelZoom={false}
            attributionControl={false}
            className="h-full w-full"
          >
            <MapInvalidateOnFullscreen />
            <TileLayer
              // Dark theme tiles for a "technology look"
              // Provider: CartoDB Dark Matter
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />

            <MapUserLocation position={userLocation} bounds={bounds} />

            <Marker
              position={PSTO_OFFICE_SITE.coordinates}
              icon={createProgramDivIcon({
                label: "PSTO",
                color: "#F59E0B",
              })}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <span style={{ fontWeight: 800 }}>PSTO</span>{" "}
                <span style={{ opacity: 0.85 }}>• {PSTO_OFFICE_SITE.name}</span>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 220, color: "#0f172a" }}>
                  <div style={{ fontWeight: 800 }}>{PSTO_OFFICE_SITE.name}</div>
                  <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                    Location:{" "}
                    <b>
                      {PSTO_OFFICE_SITE.coordinates[0].toFixed(6)},{" "}
                      {PSTO_OFFICE_SITE.coordinates[1].toFixed(6)}
                    </b>
                  </div>
                  <a
                    href={getGoogleMapsDirectionsUrl(
                      {
                        lat: PSTO_OFFICE_SITE.coordinates[0],
                        lng: PSTO_OFFICE_SITE.coordinates[1],
                      },
                      userLocation
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: 12,
                      padding: "9px 14px",
                      borderRadius: 8,
                      background: "#0054A6",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: "none",
                      textAlign: "center",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    Go
                  </a>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      lineHeight: 1.35,
                      opacity: 0.72,
                      color: "#334155",
                    }}
                  >
                    {userLocation
                      ? "Google Maps: from your current location to this office."
                      : "Google Maps opens to this office. Allow location on this page to route from where you are."}
                  </p>
                </div>
              </Popup>
            </Marker>

            {programSites.map((site) => {
              const style = PROGRAM_STYLES[site.program] ?? PROGRAM_STYLES.SSCP;
              return (
                <Marker
                  key={site.id}
                  position={site.coordinates}
                  icon={createProgramDivIcon({
                    label: site.program,
                    color: style.color,
                  })}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                    <span style={{ fontWeight: 700 }}>{site.program}</span>{" "}
                    <span style={{ opacity: 0.85 }}>• {site.name}</span>
                  </Tooltip>
                  <Popup>
                    <div style={{ minWidth: 220, color: "#0f172a" }}>
                      <div style={{ fontWeight: 800 }}>{site.name}</div>
                      <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                        Program: <b>{site.program}</b>
                        <br />
                        Beneficiary: <b>{site.municipality}</b>
                        <br />
                        Status: <b>{site.status ?? "—"}</b>
                      </div>
                      {site.description ? (
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                          {site.description}
                        </div>
                      ) : null}
                      <a
                        href={getGoogleMapsDirectionsUrl(
                          {
                            lat: site.coordinates[0],
                            lng: site.coordinates[1],
                          },
                          userLocation
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: 12,
                          padding: "9px 14px",
                          borderRadius: 8,
                          background: "#0054A6",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: "none",
                          textAlign: "center",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        Go
                      </a>
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          lineHeight: 1.35,
                          opacity: 0.72,
                          color: "#334155",
                        }}
                      >
                        {userLocation
                          ? "Google Maps: from your current location to this pin."
                          : "Google Maps opens to this site. Allow location on this page to route from where you are."}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <CoralReefMap
            className="h-full min-h-[520px] w-full rounded-none border-x-0 border-b-0 border-t-0"
            records={filteredCoralRecords}
          />
        )}

        {mapView === "PROGRAMS" ? (
          <div className="pointer-events-none absolute left-4 top-4 z-[500] hidden sm:block">
            <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 p-3 text-xs text-white/85 backdrop-blur">
              <div className="text-[11px] font-semibold tracking-wide text-white/80">
                Programs Legend
              </div>
              <div className="mt-2 grid gap-2">
                {PROGRAM_ORDER.map((key) => {
                  const v = PROGRAM_STYLES[key];
                  if (!v) return null;
                  const n = mapCountsByProgram[key] ?? 0;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="relative inline-flex h-3 w-3 items-center justify-center">
                        <span
                          aria-hidden="true"
                          className="absolute inline-flex h-3 w-3 rounded-full opacity-40 motion-safe:animate-ping"
                          style={{ backgroundColor: v.color }}
                        />
                        <span
                          className={`relative h-2.5 w-2.5 rounded-full ${v.glow} motion-safe:animate-pulse`}
                          style={{ backgroundColor: v.color }}
                        />
                      </span>
                      <span className="font-semibold text-white/90">{v.label}</span>
                      <span className="text-white/50">•</span>
                      <span className="tabular-nums text-white/80">
                        {n} site{n === 1 ? "" : "s"} on map
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 text-[11px] text-white/55 sm:px-6">
          <div className="truncate">
            Tiles © OpenStreetMap contributors • © CARTO
          </div>
          <div className="hidden sm:block">Zoom: 2-18</div>
        </div>
      </div>
    </div>
  );
};

export default Map;
