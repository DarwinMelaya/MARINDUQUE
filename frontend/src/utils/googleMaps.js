/**
 * Google Maps Directions URL (web + app deep link).
 * @see https://developers.google.com/maps/documentation/urls/get-started
 *
 * @param {{ lat: number, lng: number }} destination
 * @param {{ lat: number, lng: number } | null | undefined} origin — kapag may value, direksyon mula dito patungong destination
 * @param {"driving" | "walking" | "bicycling" | "transit"} [travelmode]
 */
export function getGoogleMapsDirectionsUrl(
  destination,
  origin = null,
  travelmode = "driving"
) {
  const dest = `${destination.lat},${destination.lng}`;
  const params = new URLSearchParams({
    api: "1",
    destination: dest,
    travelmode,
  });
  if (
    origin &&
    typeof origin.lat === "number" &&
    !Number.isNaN(origin.lat) &&
    typeof origin.lng === "number" &&
    !Number.isNaN(origin.lng)
  ) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
