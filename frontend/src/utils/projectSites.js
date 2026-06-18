/**
 * Shared helpers para sa public Map at Admin programs —
 * parehong list mula sa GET /api/projects, parehong patakaran sa coordinates.
 */

/** Display / count order (tugma sa PROGRAM_STYLES keys). */
export const PROGRAM_ORDER = ["GIA", "CEST", "SSCP", "SETUP"];

export function projectHasMapCoordinates(p) {
  const lat = p?.location?.latitude;
  const lng = p?.location?.longitude;
  return (
    lat != null &&
    lng != null &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng))
  );
}

/**
 * Shape para sa public `Map.jsx` markers (Leaflet).
 */
export function projectsToMapSites(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(projectHasMapCoordinates)
    .map((p) => ({
      id: p.id,
      program: p.programType,
      name: p.title,
      municipality: p.beneficiary,
      status: p.projectStatus,
      description: p.briefDescription,
      coordinates: [Number(p.location.latitude), Number(p.location.longitude)],
    }));
}

function emptyProgramCounts() {
  return Object.fromEntries(PROGRAM_ORDER.map((k) => [k, 0]));
}

/** Lahat ng project rows per program type (hindi lang may pin). */
export function countProjectsByProgramType(list) {
  const counts = emptyProgramCounts();
  if (!Array.isArray(list)) return counts;
  for (const p of list) {
    const t = p.programType;
    if (t != null && Object.prototype.hasOwnProperty.call(counts, t)) {
      counts[t] += 1;
    }
  }
  return counts;
}

/** Mga may valid lat/lng lang — tugma sa pins sa map. */
export function countMapSitesByProgramType(list) {
  const counts = emptyProgramCounts();
  if (!Array.isArray(list)) return counts;
  for (const p of list) {
    if (!projectHasMapCoordinates(p)) continue;
    const t = p.programType;
    if (t != null && Object.prototype.hasOwnProperty.call(counts, t)) {
      counts[t] += 1;
    }
  }
  return counts;
}
