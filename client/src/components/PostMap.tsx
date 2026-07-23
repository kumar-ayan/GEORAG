import L from "leaflet";
import { useEffect, useState } from "react";
import {
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { GeoPost } from "../api";
import {
  clampToPunjabiUniversity,
  PUNJABI_UNIVERSITY_BOUNDS,
  PUNJABI_UNIVERSITY_LEAFLET_BOUNDS,
} from "../campus";
import type { LatLng } from "../hooks/useGeolocation";

const CLUSTER_ZOOM_THRESHOLD = 16;
const MAX_ZOOM = 19;

type PostMapProps = {
  center: LatLng;
  posts: GeoPost[];
  draftPin: LatLng | null;
  onDraftPinChange: (pin: LatLng) => void;
  onViewportChange: (center: LatLng, radiusM: number) => void;
};

type Cluster = {
  key: string;
  lat: number;
  lng: number;
  posts: GeoPost[];
};

const postIcon = L.divIcon({
  className: "pin-marker",
  html: "<span></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const manualPinIcon = L.divIcon({
  className: "draft-marker",
  html: "<span></span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function clusterIcon(count: number) {
  return L.divIcon({
    className: "cluster-marker",
    html: `<span>${count}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function radiusFromBounds(map: L.Map): number {
  const center = map.getCenter();
  const corner = map.getBounds().getNorthEast();
  return Math.min(5000, Math.max(500, center.distanceTo(corner)));
}

function clusterPosts(posts: GeoPost[], zoom: number): Cluster[] {
  if (zoom >= CLUSTER_ZOOM_THRESHOLD) {
    return posts.map((post) => ({
      key: post.id,
      lat: post.public_lat,
      lng: post.public_lng,
      posts: [post],
    }));
  }

  const grid = new Map<string, GeoPost[]>();
  const precision = zoom < 14 ? 2 : 3;

  posts.forEach((post) => {
    const key = `${post.public_lat.toFixed(precision)}:${post.public_lng.toFixed(precision)}`;
    grid.set(key, [...(grid.get(key) ?? []), post]);
  });

  return [...grid.entries()].map(([key, groupedPosts]) => {
    const lat =
      groupedPosts.reduce((sum, post) => sum + post.public_lat, 0) / groupedPosts.length;
    const lng =
      groupedPosts.reduce((sum, post) => sum + post.public_lng, 0) / groupedPosts.length;

    return { key, lat, lng, posts: groupedPosts };
  });
}

type MapEventsProps = Omit<PostMapProps, "center" | "posts" | "draftPin"> & {
  onZoomChange: (zoom: number) => void;
};

function MapEvents({ onDraftPinChange, onViewportChange, onZoomChange }: MapEventsProps) {
  const map = useMapEvents({
    click(event) {
      onDraftPinChange(
        clampToPunjabiUniversity({ lat: event.latlng.lat, lng: event.latlng.lng }),
      );
    },
    moveend() {
      const center = clampToPunjabiUniversity(map.getCenter());
      onViewportChange(center, radiusFromBounds(map));
    },
    zoomend() {
      const center = clampToPunjabiUniversity(map.getCenter());
      onZoomChange(map.getZoom());
      onViewportChange(center, radiusFromBounds(map));
    },
  });

  return null;
}

function MapCenter({ center }: { center: LatLng }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: false });
  }, [center, map]);

  return null;
}

function CampusViewportLock({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(PUNJABI_UNIVERSITY_LEAFLET_BOUNDS);

    function lockToCampus() {
      const minCampusZoom = Math.min(MAX_ZOOM, map.getBoundsZoom(bounds, true));

      map.setMaxBounds(bounds);
      map.setMinZoom(minCampusZoom);

      if (map.getZoom() < minCampusZoom) {
        map.setZoom(minCampusZoom, { animate: false });
      }

      map.panInsideBounds(bounds, { animate: false });
      onZoomChange(map.getZoom());
    }

    lockToCampus();
    map.on("resize", lockToCampus);

    return () => {
      map.off("resize", lockToCampus);
    };
  }, [map, onZoomChange]);

  return null;
}

function CampusMask() {
  const shade = {
    color: "transparent",
    fillColor: "#f6f8f5",
    fillOpacity: 0.84,
    interactive: false,
  };
  const { south, west, north, east } = PUNJABI_UNIVERSITY_BOUNDS;

  return (
    <>
      <Rectangle bounds={[[-90, -180], [south, 180]]} pathOptions={shade} />
      <Rectangle bounds={[[north, -180], [90, 180]]} pathOptions={shade} />
      <Rectangle bounds={[[south, -180], [north, west]]} pathOptions={shade} />
      <Rectangle bounds={[[south, east], [north, 180]]} pathOptions={shade} />
      <Rectangle
        bounds={PUNJABI_UNIVERSITY_LEAFLET_BOUNDS}
        pathOptions={{
          color: "#176b87",
          weight: 2,
          fillOpacity: 0,
          interactive: false,
        }}
      />
    </>
  );
}

export default function PostMap({
  center,
  posts,
  draftPin,
  onDraftPinChange,
  onViewportChange,
}: PostMapProps) {
  const [zoom, setZoom] = useState(16);

  return (
    <MapContainer
      center={center}
      zoom={MAX_ZOOM}
      maxZoom={MAX_ZOOM}
      maxBounds={PUNJABI_UNIVERSITY_LEAFLET_BOUNDS}
      maxBoundsViscosity={1}
      className="map"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Normal">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <CampusMask />
      <CampusViewportLock onZoomChange={setZoom} />
      <MapCenter center={center} />
      <MapEvents
        onDraftPinChange={onDraftPinChange}
        onViewportChange={onViewportChange}
        onZoomChange={setZoom}
      />

      {clusterPosts(posts, zoom).map((cluster) =>
        cluster.posts.length === 1 ? (
          <Marker
            key={cluster.key}
            position={[cluster.lat, cluster.lng]}
            icon={postIcon}
          >
            <Popup>
              <strong>{cluster.posts[0].category}</strong>
              <p>{cluster.posts[0].text}</p>
              <small>
                {cluster.posts[0].gps_verified ? "GPS verified" : "Manual pin"}
              </small>
            </Popup>
          </Marker>
        ) : (
          <Marker
            key={cluster.key}
            position={[cluster.lat, cluster.lng]}
            icon={clusterIcon(cluster.posts.length)}
          >
            <Popup>{cluster.posts.length} posts in this area</Popup>
          </Marker>
        ),
      )}

      {draftPin ? (
        <Marker position={[draftPin.lat, draftPin.lng]} icon={manualPinIcon}>
          <Popup>Manual pin location</Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
