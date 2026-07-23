from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.campus import PUNJABI_UNIVERSITY_BOUNDS, is_inside_punjabi_university
from app.db import connect
from app.schemas import NearbyPostsResponse, PostCreate, PostResponse


router = APIRouter(prefix="/posts", tags=["posts"])

POST_SELECT_COLUMNS = """
    id,
    text,
    category,
    ST_Y(public_location::geometry) AS public_lat,
    ST_X(public_location::geometry) AS public_lng,
    gps_verified,
    image_url,
    created_at,
    expires_at
"""


def row_to_post(row: dict[str, Any]) -> PostResponse:
    return PostResponse.model_validate(row)


def require_campus_point(lat: float, lng: float) -> None:
    if not is_inside_punjabi_university(lat, lng):
        raise HTTPException(
            status_code=422,
            detail="Location must be inside Punjabi University, Patiala.",
        )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate) -> PostResponse:
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                INSERT INTO posts (
                    text,
                    category,
                    public_location,
                    gps_verified,
                    image_url,
                    expires_at
                )
                VALUES (
                    %(text)s,
                    %(category)s,
                    ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s), 4326)::geography,
                    %(gps_verified)s,
                    %(image_url)s,
                    CASE
                        WHEN %(category)s IN ('Event', 'Lost&Found')
                        THEN now() + interval '7 days'
                        ELSE NULL
                    END
                )
                RETURNING {POST_SELECT_COLUMNS}
                """,
                {
                    "text": payload.text,
                    "category": payload.category.value,
                    "lng": payload.public_lng,
                    "lat": payload.public_lat,
                    "gps_verified": payload.gps_verified,
                    "image_url": payload.image_url,
                },
            )
            row = cursor.fetchone()
            connection.commit()

    return row_to_post(row)


@router.get("/nearby", response_model=NearbyPostsResponse)
def list_nearby_posts(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    radius_m: int = Query(default=2000, ge=1, le=5000),
    limit: int = Query(default=300, ge=1, le=500),
) -> NearbyPostsResponse:
    require_campus_point(lat, lng)

    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT {POST_SELECT_COLUMNS}
                FROM posts
                WHERE is_hidden = false
                  AND (expires_at IS NULL OR expires_at > now())
                  AND ST_Covers(
                    ST_MakeEnvelope(%(west)s, %(south)s, %(east)s, %(north)s, 4326),
                    public_location::geometry
                  )
                  AND ST_DWithin(
                    public_location,
                    ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s), 4326)::geography,
                    %(radius_m)s
                  )
                ORDER BY
                  ST_Distance(
                    public_location,
                    ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s), 4326)::geography
                  ) ASC,
                  created_at DESC
                LIMIT %(limit)s
                """,
                {
                    "lat": lat,
                    "lng": lng,
                    "radius_m": radius_m,
                    "limit": limit,
                    "south": PUNJABI_UNIVERSITY_BOUNDS.south,
                    "west": PUNJABI_UNIVERSITY_BOUNDS.west,
                    "north": PUNJABI_UNIVERSITY_BOUNDS.north,
                    "east": PUNJABI_UNIVERSITY_BOUNDS.east,
                },
            )
            rows = cursor.fetchall()

    return NearbyPostsResponse(posts=[row_to_post(row) for row in rows])
