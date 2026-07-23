from __future__ import annotations

import os
from pathlib import Path

import psycopg
import pytest


TEST_DATABASE_URL = os.getenv("GEORAG_TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
MIGRATION_PATH = Path(__file__).resolve().parents[1] / "db" / "migrations" / "001_init.sql"


@pytest.fixture(scope="session")
def database_url() -> str:
    if not TEST_DATABASE_URL:
        pytest.skip("Set GEORAG_TEST_DATABASE_URL to run PostGIS integration tests.")
    return TEST_DATABASE_URL


@pytest.fixture
def migrated_db(monkeypatch: pytest.MonkeyPatch, database_url: str) -> None:
    monkeypatch.setenv("DATABASE_URL", database_url)

    with psycopg.connect(database_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute(MIGRATION_PATH.read_text(encoding="utf-8"))
