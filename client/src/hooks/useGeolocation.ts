import { useEffect, useState } from "react";
import { isInsidePunjabiUniversity, PUNJABI_UNIVERSITY_CENTER } from "../campus";

export type LatLng = {
  lat: number;
  lng: number;
};

export function useGeolocation() {
  const [position, setPosition] = useState<LatLng>(PUNJABI_UNIVERSITY_CENTER);
  const [gpsAvailable, setGpsAvailable] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const browserPosition = {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        };

        if (isInsidePunjabiUniversity(browserPosition)) {
          setPosition(browserPosition);
          setGpsAvailable(true);
          return;
        }

        setPosition(PUNJABI_UNIVERSITY_CENTER);
        setGpsAvailable(false);
      },
      () => {
        setGpsAvailable(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  }, []);

  return { position, gpsAvailable };
}
