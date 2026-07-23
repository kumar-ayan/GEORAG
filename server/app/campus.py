from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CampusBounds:
    south: float
    west: float
    north: float
    east: float


PUNJABI_UNIVERSITY_BOUNDS = CampusBounds(
    south=30.3500,
    west=76.4390,
    north=30.3650,
    east=76.4620,
)


def is_inside_punjabi_university(lat: float, lng: float) -> bool:
    return (
        PUNJABI_UNIVERSITY_BOUNDS.south <= lat <= PUNJABI_UNIVERSITY_BOUNDS.north
        and PUNJABI_UNIVERSITY_BOUNDS.west <= lng <= PUNJABI_UNIVERSITY_BOUNDS.east
    )
