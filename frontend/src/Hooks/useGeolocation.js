import { useEffect, useState } from "react";

/**
 * Browser geolocation (watch). Returns latest lat/lng + accuracy for map layers.
 * @param {GeolocationPositionOptions & { enabled?: boolean }} [options] — set `enabled: false` to skip watching (no permission prompt).
 */
export function useGeolocation(options = {}) {
  const { enabled = true, ...geoOptions } = options;

  const [state, setState] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        lat: null,
        lng: null,
        accuracy: null,
        error: null,
        loading: false,
      });
      return undefined;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Geolocation is not supported.",
      }));
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy:
            typeof pos.coords.accuracy === "number" && !Number.isNaN(pos.coords.accuracy)
              ? pos.coords.accuracy
              : null,
          error: null,
          loading: false,
        });
      },
      (err) => {
        let message = "Could not get location.";
        if (err.code === 1) message = "Location permission denied.";
        else if (err.code === 2) message = "Position unavailable.";
        else if (err.code === 3) message = "Location request timed out.";
        setState((s) => ({
          ...s,
          loading: false,
          error: message,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 20_000,
        ...geoOptions,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geoOptions are optional overrides; stable watch is enough
  }, [enabled]);

  return state;
}
