import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import PostMap from "./components/PostMap";
import { createPost, fetchNearbyPosts, GeoPost, PostCategory } from "./api";
import { clampToPunjabiUniversity, isInsidePunjabiUniversity } from "./campus";
import { LatLng, useGeolocation } from "./hooks/useGeolocation";

const categories: PostCategory[] = [
  "Safety",
  "Recommendation",
  "Lost&Found",
  "Event",
  "General",
];

export default function App() {
  const { position, gpsAvailable } = useGeolocation();
  const [posts, setPosts] = useState<GeoPost[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<PostCategory>("General");
  const [draftPin, setDraftPin] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(position);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMapCenter(position);
  }, [position]);

  const postLocation = useMemo(() => draftPin ?? position, [draftPin, position]);

  const loadPins = useCallback(async (center: LatLng, radiusM = 2000) => {
    const campusCenter = clampToPunjabiUniversity(center);

    try {
      const nearbyPosts = await fetchNearbyPosts(campusCenter.lat, campusCenter.lng, radiusM);
      setPosts(nearbyPosts);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Pins could not be loaded.");
    }
  }, []);

  useEffect(() => {
    loadPins(position);
  }, [loadPins, position]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setStatus("Post text is required.");
      return;
    }

    if (!isInsidePunjabiUniversity(postLocation)) {
      setStatus("Pins are limited to Punjabi University, Patiala.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const created = await createPost({
        text: text.trim(),
        category,
        public_lat: postLocation.lat,
        public_lng: postLocation.lng,
        gps_verified: draftPin ? false : gpsAvailable,
      });

      setPosts((currentPosts) => [created, ...currentPosts]);
      setText("");
      setDraftPin(null);
      setMapCenter({ lat: created.public_lat, lng: created.public_lng });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Post could not be created.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <PostMap
        center={mapCenter}
        posts={posts}
        draftPin={draftPin}
        onDraftPinChange={setDraftPin}
        onViewportChange={loadPins}
      />

      <section className="compose-panel" aria-label="Create a location-pinned post">
        <div className="brand-row">
          <div>
            <h1>GeoRAG</h1>
            <p>Punjabi University, Patiala</p>
          </div>
          <span className={gpsAvailable ? "gps gps-on" : "gps gps-off"}>
            {gpsAvailable ? "GPS" : "Manual"}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="post-text">Post</label>
          <textarea
            id="post-text"
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 280))}
            maxLength={280}
            placeholder="What should people nearby know?"
          />
          <div className="form-meta">
            <span>{280 - text.length} left</span>
            <span>
              {postLocation.lat.toFixed(5)}, {postLocation.lng.toFixed(5)}
            </span>
          </div>

          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value as PostCategory)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Posting..." : "Pin post"}
          </button>
        </form>

        {draftPin ? (
          <button className="secondary-button" type="button" onClick={() => setDraftPin(null)}>
            Use GPS location
          </button>
        ) : null}

        {status ? <p className="status-message">{status}</p> : null}
      </section>
    </main>
  );
}
