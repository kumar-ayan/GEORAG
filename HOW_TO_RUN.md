# GeoRAG: How to Run Guide

This guide provides complete end-to-end instructions for installing, configuring, running, testing, and troubleshooting the **GeoRAG** hyperlocal community application (Punjabi University, Patiala beachhead).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Setup (PostGIS Docker)](#4-database-setup-postgis-docker)
5. [Backend Setup & Running (FastAPI)](#5-backend-setup--running-fastapi)
6. [Frontend Setup & Running (React + Vite)](#6-frontend-setup--running-react--vite)
7. [All-in-One Quickstart Summary](#7-all-in-one-quickstart-summary)
8. [Running Tests](#8-running-tests)
9. [API Testing & Verification](#9-api-testing--verification)
10. [Troubleshooting & Common Issues](#10-troubleshooting--common-issues)

---

## 1. Prerequisites

Ensure the following tools are installed on your machine:

- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher (comes with Node.js)
- **Python**: `v3.11` or higher ([Download Python](https://www.python.org/))
- **Docker & Docker Desktop**: Installed and running ([Download Docker](https://www.docker.com/))
- **Git**: Installed for source control

---

## 2. Repository Structure

```
App/
├── client/                 # Frontend React + Vite + Leaflet PWA
│   ├── src/                # UI Components, Map logic, API integration
│   ├── package.json        # Frontend dependencies & scripts
│   ├── tsconfig.json       # TypeScript configuration
│   └── vite.config.ts      # Vite dev server configuration
├── server/                 # Backend FastAPI application
│   ├── app/                # Application modules
│   │   ├── main.py         # FastAPI application entrypoint & middleware
│   │   ├── posts.py        # Post creation & spatial query endpoints
│   │   ├── db.py           # PostGIS database connection manager
│   │   ├── campus.py       # Campus geographic boundary constraints
│   │   └── schemas.py      # Pydantic validation schemas
│   ├── db/
│   │   └── migrations/     # PostGIS SQL migrations (001_init.sql)
│   ├── tests/              # Pytest integration & spatial tests
│   └── requirements.txt    # Python backend dependencies
├── infra/                  # Infrastructure configuration
│   └── docker-compose.yml  # PostGIS database container setup
├── AGENTS.md               # Project architecture & development rules
├── DESIGN.md               # Technical design document
└── README.md               # General overview
```

---

## 3. Environment Configuration

### Backend Environment Variables (`server/.env`)

1. Copy the sample environment file in `server/`:
   ```bash
   cp server/.env.example server/.env
   ```
2. Edit `server/.env` to configure your local environment:
   ```ini
   DATABASE_URL=postgresql://georag:georag@localhost:5432/georag
   CORS_ORIGINS=http://localhost:5173
   ```

### Frontend Environment Variables (`client/.env`)

Create a `.env` file in the `client/` directory (if targeting a custom API host):
```ini
VITE_API_BASE_URL=http://localhost:8000
```

---

## 4. Database Setup (PostGIS Docker)

GeoRAG relies on **PostgreSQL 16** with the **PostGIS 3.4** spatial extension.

### Step 4.1: Start PostGIS Container

From the repository root directory, run:

```bash
docker compose -f infra/docker-compose.yml up -d db
```

To check if the container is running and healthy:
```bash
docker compose -f infra/docker-compose.yml ps
```

### Step 4.2: Apply Database Migrations

Apply the initial schema migration `001_init.sql` to set up PostGIS extensions, ENUM types, spatial indexes, and boundary constraints.

#### Option A: Using Docker Exec (Recommended - No local `psql` required)

**On Windows PowerShell / Command Prompt:**
```powershell
Get-Content server/db/migrations/001_init.sql | docker exec -i app-db-1 psql -U georag -d georag
```
*(Note: Replace `app-db-1` with your container name if different, e.g. `infra-db-1` or `georag-db-1`)*

**On Linux / macOS Bash:**
```bash
docker exec -i $(docker ps -q -f name=db) psql -U georag -d georag < server/db/migrations/001_init.sql
```

#### Option B: Using local `psql` command

```bash
psql postgresql://georag:georag@localhost:5432/georag -f server/db/migrations/001_init.sql
```

---

## 5. Backend Setup & Running (FastAPI)

### Step 5.1: Create & Activate Virtual Environment

**On Windows (PowerShell):**
```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On Linux / macOS:**
```bash
cd server
python3 -m venv venv
source venv/bin/activate
```

### Step 5.2: Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### Step 5.3: Start Uvicorn Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check Endpoint**: `http://localhost:8000/health`

---

## 6. Frontend Setup & Running (React + Vite)

Open a new terminal window/tab for the frontend server.

### Step 6.1: Navigate to Client Directory & Install Dependencies

```bash
cd client
npm install
```

### Step 6.2: Start Vite Development Server

```bash
npm run dev
```

- **Frontend App URL**: `http://localhost:5173`

### Frontend Scripts Reference

- `npm run dev`: Launch the interactive map application in dev mode.
- `npm run build`: Type-check and compile production bundle into `dist/`.
- `npm run lint`: Run TypeScript type checking (`tsc --noEmit`).

---

## 7. All-in-One Quickstart Summary

### Terminal 1 — PostGIS Database & Migrations
```bash
# 1. Start database
docker compose -f infra/docker-compose.yml up -d db

# 2. Run migrations
docker exec -i $(docker ps -q -f name=db) psql -U georag -d georag < server/db/migrations/001_init.sql
```

### Terminal 2 — FastAPI Backend
```bash
cd server
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1 | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Terminal 3 — Vite Frontend
```bash
cd client
npm install
npm run dev
```

---

## 8. Running Tests

### Backend Unit & Integration Tests

The backend test suite verifies FastAPI routes, spatial distance queries, and geographic boundary constraints against PostGIS.

1. Ensure the PostGIS database container is running (`docker compose -f infra/docker-compose.yml up -d db`).
2. Activate your virtual environment in `server/`.
3. Run `pytest`:

```bash
cd server
pytest -v
```

Expected output:
```text
tests/test_posts.py::test_create_and_fetch_nearby_post PASSED
tests/test_posts.py::test_rejects_out_of_campus_post PASSED
```

---

## 9. API Testing & Verification

### 1. Health Check
```bash
curl http://localhost:8000/health
```
**Response:** `{"status":"ok"}`

---

### 2. Create Geo-tagged Post (`POST /posts`)

> **Campus Location Constraint**: Posts MUST be inside Punjabi University, Patiala bounding box:
> - Latitude: `30.3500` to `30.3650`
> - Longitude: `76.4390` to `76.4620`

```bash
curl -X POST "http://localhost:8000/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Found a blue notebook near the Computer Science department!",
    "category": "Lost&Found",
    "public_lat": 30.3550,
    "public_lng": 76.4500,
    "gps_verified": true,
    "image_url": null
  }'
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "text": "Found a blue notebook near the Computer Science department!",
  "category": "Lost&Found",
  "public_lat": 30.3550,
  "public_lng": 76.4500,
  "gps_verified": true,
  "image_url": null,
  "created_at": "2026-07-24T22:00:00Z",
  "expires_at": "2026-07-31T22:00:00Z"
}
```

---

### 3. Retrieve Nearby Posts (`GET /posts/nearby`)

```bash
curl "http://localhost:8000/posts/nearby?lat=30.3550&lng=76.4500&radius_m=2000"
```

---

## 10. Troubleshooting & Common Issues

### Issue 1: `psycopg.OperationalError: connection failed`
- **Cause**: PostGIS container is not running or listening on port 5432.
- **Solution**:
  1. Check Docker container status: `docker ps`
  2. Start container: `docker compose -f infra/docker-compose.yml up -d db`
  3. Check logs: `docker logs <container_id>`

### Issue 2: `422 Unprocessable Entity - Location must be inside Punjabi University, Patiala`
- **Cause**: Submitted coordinates are outside the campus boundary envelope.
- **Solution**: Use valid campus coordinates, e.g. `lat: 30.3550`, `lng: 76.4500`.

### Issue 3: CORS Blocking Requests in Frontend Browser
- **Cause**: Backend `CORS_ORIGINS` does not match Vite server address.
- **Solution**: Set `CORS_ORIGINS=http://localhost:5173` in `server/.env` and restart Uvicorn.

### Issue 4: `Port 5432 is already in use`
- **Cause**: A local instance of PostgreSQL is already running on port 5432.
- **Solution**: Stop local Postgres service or change mapped port in `infra/docker-compose.yml` (e.g., `"5433:5432"`) and update `DATABASE_URL` accordingly.
