export type PostCategory =
  | "Safety"
  | "Recommendation"
  | "Lost&Found"
  | "Event"
  | "General";

export type GeoPost = {
  id: string;
  text: string;
  category: PostCategory;
  public_lat: number;
  public_lng: number;
  gps_verified: boolean;
  image_url: string | null;
  created_at: string;
  expires_at: string | null;
};

export type CreatePostPayload = {
  text: string;
  category: PostCategory;
  public_lat: number;
  public_lng: number;
  gps_verified: boolean;
  image_url?: string | null;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function createPost(payload: CreatePostPayload): Promise<GeoPost> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Post could not be created.");
  }

  return response.json();
}

export async function fetchNearbyPosts(
  lat: number,
  lng: number,
  radiusM = 2000,
): Promise<GeoPost[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_m: String(radiusM),
  });

  const response = await fetch(`${API_BASE_URL}/posts/nearby?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Pins could not be loaded.");
  }

  const body = (await response.json()) as { posts: GeoPost[] };
  return body.posts;
}
