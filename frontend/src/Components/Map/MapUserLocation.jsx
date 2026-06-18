import { useEffect, useMemo, useRef } from "react";
import { Circle, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

const userIcon = L.divIcon({
  className: "dost-user-location-marker",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -12],
  html: `
    <div class="relative h-[26px] w-[26px]">
      <span class="absolute inset-0 rounded-full bg-sky-400/40 motion-safe:animate-ping"></span>
      <span class="absolute inset-[4px] rounded-full border-2 border-white bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,.85)]"></span>
      <span class="absolute inset-[9px] rounded-full bg-white/90"></span>
    </div>
  `.trim(),
});

function FlyToFirstFix({ lat, lng, bounds }) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || lat == null || lng == null) return;
    const ll = L.latLng(lat, lng);
    if (bounds && !bounds.contains(ll)) {
      done.current = true;
      return;
    }
    map.flyTo(ll, Math.max(map.getZoom(), 13), { duration: 0.85 });
    done.current = true;
  }, [map, bounds, lat, lng]);

  return null;
}

/** Continuously pan the map to the user's position when `follow` is true. */
function FollowPosition({ lat, lng, follow }) {
  const map = useMap();
  const prevRef = useRef({ lat: null, lng: null });

  useEffect(() => {
    if (!follow || lat == null || lng == null) return;
    // Only pan when the position actually changed to avoid jitter
    if (prevRef.current.lat === lat && prevRef.current.lng === lng) return;
    prevRef.current = { lat, lng };
    map.panTo(L.latLng(lat, lng), { animate: true, duration: 0.4 });
  }, [map, follow, lat, lng]);

  return null;
}

/**
 * @param {{ lat: number, lng: number, accuracy?: number | null } | null} props.position
 * @param {import("leaflet").LatLngBounds | null} [props.bounds]
 * @param {boolean} [props.follow] — when true, the map pans to keep the user centred
 */
export default function MapUserLocation({ position, bounds = null, follow = false }) {
  const radiusM = useMemo(() => {
    if (!position?.accuracy || position.accuracy <= 0) return 45;
    return Math.min(Math.max(position.accuracy, 12), 400);
  }, [position]);

  if (
    !position ||
    typeof position.lat !== "number" ||
    Number.isNaN(position.lat) ||
    typeof position.lng !== "number" ||
    Number.isNaN(position.lng)
  ) {
    return null;
  }

  const ll = L.latLng(position.lat, position.lng);

  return (
    <>
      {bounds && !follow ? (
        <FlyToFirstFix lat={position.lat} lng={position.lng} bounds={bounds} />
      ) : null}
      <FollowPosition lat={position.lat} lng={position.lng} follow={follow} />
      <Circle
        center={ll}
        radius={radiusM}
        pathOptions={{
          color: "#38BDF8",
          weight: 1,
          opacity: 0.65,
          fillColor: "#38BDF8",
          fillOpacity: 0.12,
        }}
      />
      <Marker position={ll} icon={userIcon}>
        <Tooltip direction="top" offset={[0, -8]} opacity={1}>
          <span style={{ fontWeight: 700 }}>You are here</span>
        </Tooltip>
        <Popup>
          <div style={{ minWidth: 200, color: "#0f172a", fontSize: 13 }}>
            <div style={{ fontWeight: 800 }}>Your current location</div>
            <div style={{ marginTop: 8, lineHeight: 1.5 }}>
              Lat: <b>{position.lat.toFixed(5)}</b>
              <br />
              Lng: <b>{position.lng.toFixed(5)}</b>
              {position.accuracy != null ? (
                <>
                  <br />
                  Accuracy: ~{Math.round(position.accuracy)} m
                </>
              ) : null}
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
