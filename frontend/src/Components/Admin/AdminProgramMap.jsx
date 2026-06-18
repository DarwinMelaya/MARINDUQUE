import { useEffect, useMemo } from "react";
import { useGeolocation } from "../../Hooks/useGeolocation";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import {
  PROGRAM_ORDER,
  countMapSitesByProgramType,
  projectHasMapCoordinates,
} from "../../utils/projectSites";
import MapUserLocation from "../Map/MapUserLocation";
import {
  PROGRAM_STYLES,
  createProgramDivIcon,
  fixLeafletDefaultIcons,
} from "../Map/programMarkers";

function MapClickPick({ onPick, active }) {
  useMapEvents({
    click(e) {
      if (!active || !onPick) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * @param {object} props
 * @param {Array<{
 *   id: string,
 *   programType: string,
 *   title: string,
 *   amountOfAssistance?: string,
 *   beneficiary?: string,
 *   contactPerson?: string,
 *   briefDescription?: string,
 *   projectStatus?: string,
 *   location: { latitude: number | null, longitude: number | null }
 * }>} props.projects
 * @param {boolean} [props.pickMode]
 * @param {(lat: number, lng: number) => void} [props.onPickLocation]
 * @param {{ lat: number, lng: number } | null} [props.pickerPosition]
 * @param {string} [props.className]
 * @param {boolean} [props.splitLayout] — when true, map fills a flex parent (modal split view)
 * @param {boolean} [props.showUserLocation] — GPS "you are here" + accuracy ring (off on admin by default)
 */
const AdminProgramMap = ({
  projects,
  pickMode = false,
  onPickLocation,
  pickerPosition = null,
  className = "",
  splitLayout = false,
  showUserLocation = false,
}) => {
  const geo = useGeolocation({ enabled: showUserLocation });
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

  const rootSplit = splitLayout ? "h-full min-h-0 flex flex-col" : "";
  const bounds = useMemo(
    () =>
      L.latLngBounds(
        L.latLng(13.12, 121.8),
        L.latLng(13.57, 122.4)
      ),
    []
  );

  const center = useMemo(() => L.latLng(13.4463, 122.0837), []);

  const sitesOnMap = useMemo(
    () => projects.filter(projectHasMapCoordinates),
    [projects]
  );

  const mapCountsByProgram = useMemo(
    () => countMapSitesByProgramType(projects),
    [projects]
  );

  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  const pickerIcon = useMemo(
    () =>
      createProgramDivIcon({
        label: "＋",
        color: "#FDB913",
      }),
    []
  );

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur ${rootSplit} ${pickMode ? "ring-2 ring-[#FDB913]/40" : ""} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(99,179,237,.30)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.20)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="text-left">
          <div className="text-xs font-medium tracking-wide text-white/60">
            {pickMode ? "Set location" : "Admin map"}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-white">
            {pickMode
              ? "Click the map to place the project pin"
              : "Marinduque — saved projects"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]" />
            {sitesOnMap.length} on map
          </div>
          <div className="max-w-[min(100vw-2rem,240px)] text-right text-[10px] leading-tight text-white/50">
            {showUserLocation ? (
              geo.loading ? (
                <span className="text-sky-300/90">Finding your location…</span>
              ) : geo.error ? (
                <span title={geo.error}>Location: {geo.error}</span>
              ) : userLocation ? (
                <span className="text-emerald-300/90">Your location is on the map</span>
              ) : null
            ) : (
              <span className="text-white/40">Project pins only</span>
            )}
          </div>
        </div>
      </div>

      <div
        className={
          splitLayout
            ? "relative min-h-0 w-full flex-1 basis-0"
            : "relative h-[min(70vh,640px)] min-h-[420px] w-full"
        }
      >
        <MapContainer
          center={center}
          zoom={11}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom
          attributionControl={false}
          className={`h-full min-h-[280px] w-full z-0 ${pickMode ? "cursor-crosshair" : ""}`}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />

          <MapClickPick
            active={Boolean(pickMode && onPickLocation)}
            onPick={onPickLocation}
          />

          {showUserLocation ? (
            <MapUserLocation position={userLocation} bounds={bounds} />
          ) : null}

          {sitesOnMap.map((site) => {
            const style =
              PROGRAM_STYLES[site.programType] ?? PROGRAM_STYLES.SSCP;
            const pos = [
              site.location.latitude,
              site.location.longitude,
            ];
            return (
              <Marker
                key={site.id}
                position={pos}
                icon={createProgramDivIcon({
                  label: site.programType,
                  color: style.color,
                })}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <span style={{ fontWeight: 700 }}>{site.programType}</span>{" "}
                  <span style={{ opacity: 0.85 }}>• {site.title}</span>
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 240, color: "#0f172a" }}>
                    <div style={{ fontWeight: 800 }}>{site.title}</div>
                    {Array.isArray(site.images) && site.images[0] ? (
                      <img
                        src={site.images[0]}
                        alt=""
                        style={{
                          width: "100%",
                          maxHeight: 140,
                          objectFit: "cover",
                          borderRadius: 8,
                          marginTop: 8,
                          display: "block",
                        }}
                      />
                    ) : null}
                    <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
                      <div>
                        Program: <b>{site.programType}</b>
                      </div>
                      <div>
                        Status: <b>{site.projectStatus ?? "—"}</b>
                      </div>
                      {site.beneficiary ? (
                        <div style={{ marginTop: 6 }}>
                          Beneficiary: <b>{site.beneficiary}</b>
                        </div>
                      ) : null}
                      {site.amountOfAssistance ? (
                        <div>
                          Assistance: <b>{site.amountOfAssistance}</b>
                        </div>
                      ) : null}
                      {site.contactPerson ? (
                        <div>
                          Contact: <b>{site.contactPerson}</b>
                        </div>
                      ) : null}
                      {site.briefDescription ? (
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                          {site.briefDescription}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {pickerPosition &&
          typeof pickerPosition.lat === "number" &&
          !Number.isNaN(pickerPosition.lat) &&
          typeof pickerPosition.lng === "number" &&
          !Number.isNaN(pickerPosition.lng) ? (
            <Marker
              position={[pickerPosition.lat, pickerPosition.lng]}
              icon={pickerIcon}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                Draft location
              </Tooltip>
            </Marker>
          ) : null}
        </MapContainer>

        <div className="pointer-events-none absolute left-4 top-4 z-[500] hidden sm:block">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 p-3 text-xs text-white/85 backdrop-blur">
            <div className="text-[11px] font-semibold tracking-wide text-white/80">
              Programs legend
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
                      {n} on map
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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

export default AdminProgramMap;
