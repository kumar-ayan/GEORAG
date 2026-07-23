from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_create_post_and_list_nearby(migrated_db: None) -> None:
    payload = {
        "text": "Water logging near the library gate",
        "category": "Safety",
        "public_lat": 30.3564,
        "public_lng": 76.4491,
        "gps_verified": True,
    }

    create_response = client.post("/posts", json=payload)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["text"] == payload["text"]
    assert created["category"] == "Safety"
    assert created["gps_verified"] is True
    assert "device_lat" not in created
    assert "device_lng" not in created

    nearby_response = client.get(
        "/posts/nearby",
        params={"lat": 30.3564, "lng": 76.4491, "radius_m": 2000},
    )

    assert nearby_response.status_code == 200
    post_ids = {post["id"] for post in nearby_response.json()["posts"]}
    assert created["id"] in post_ids


def test_create_post_rejects_invalid_geo_input() -> None:
    response = client.post(
        "/posts",
        json={
            "text": "Invalid pin",
            "category": "General",
            "public_lat": 95,
            "public_lng": 76.4491,
            "gps_verified": False,
        },
    )

    assert response.status_code == 422


def test_create_post_rejects_outside_campus() -> None:
    response = client.post(
        "/posts",
        json={
            "text": "Outside campus",
            "category": "General",
            "public_lat": 30.3400,
            "public_lng": 76.4300,
            "gps_verified": False,
        },
    )

    assert response.status_code == 422


def test_nearby_posts_rejects_invalid_geo_input() -> None:
    response = client.get(
        "/posts/nearby",
        params={"lat": 30.3564, "lng": 190, "radius_m": 2000},
    )

    assert response.status_code == 422


def test_nearby_posts_rejects_outside_campus() -> None:
    response = client.get(
        "/posts/nearby",
        params={"lat": 30.3400, "lng": 76.4300, "radius_m": 2000},
    )

    assert response.status_code == 422
