import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export const PROGRAM_STYLES = {
  SSCP: {
    label: "SSCP",
    color: "#22D3EE",
    glow: "shadow-[0_0_18px_rgba(34,211,238,.55)]",
  },
  CEST: {
    label: "CEST",
    color: "#FDB913",
    glow: "shadow-[0_0_18px_rgba(253,185,19,.45)]",
  },
  SETUP: {
    label: "SETUP",
    color: "#A78BFA",
    glow: "shadow-[0_0_18px_rgba(167,139,250,.45)]",
  },
  GIA: {
    label: "GIA",
    color: "#34D399",
    glow: "shadow-[0_0_18px_rgba(52,211,153,.45)]",
  },
};

export function createProgramDivIcon({ label, color }) {
  const safeLabel = String(label ?? "").slice(0, 6);

  return L.divIcon({
    className: "dost-program-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `
      <div class="relative h-7 w-7">
        <span class="absolute inset-0 rounded-full opacity-35 motion-safe:animate-ping" style="background:${color};"></span>
        <span class="absolute inset-0 rounded-full opacity-30 blur-[2px]" style="background:${color};"></span>
        <span class="absolute inset-[5px] rounded-full shadow-[0_0_16px_rgba(255,255,255,.12)] motion-safe:animate-pulse" style="background:${color};"></span>
        <span class="absolute inset-0 grid place-items-center text-[9px] font-extrabold tracking-wide text-white drop-shadow-[0_0_10px_rgba(0,0,0,.85)]">
          ${safeLabel}
        </span>
      </div>
    `.trim(),
  });
}

export function fixLeafletDefaultIcons() {
  // eslint-disable-next-line no-underscore-dangle
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
}
