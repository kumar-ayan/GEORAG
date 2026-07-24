# GeoRAG: Hyperlocal Community Platform for Punjabi University, Patiala

![GeoRAG Logo](https://via.placeholder.com/800x200/176b87/ffffff?text=GeoRAG+-+Hyperlocal+Community+Platform)

> A single-campus, map-native community PWA that combines geo-tagged posts with AI-powered location-based queries.

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Data Model](#data-model)
- [Spatial Queries](#spatial-queries)
- [AI Features](#ai-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

GeoRAG is a hyperlocal, map-native community platform designed specifically for Punjabi University, Patiala. Instead of traditional text-based feeds, users create geo-tagged posts that appear on a map based on their physical location. The platform integrates AI capabilities to enable natural-language queries about the local environment.

### Key Product Goals (v1)
- **WAU**: 300+ weekly active users at beachhead campus
- **Day-7 retention**: ≥25% of Week-1 signups return in Week 2
- **Posts/week**: 150+ new location-pinned posts
- **AI query usage**: ≥15% of sessions using "ask the map"
- **GPS-verified post rate**: ≥70% of posts with verified location
- **Time-to-first-post**: <5 minutes from signup to first post

## System Architecture

```mermaid
graph TD
    A[Client PWA] -->|REST API| B[API Layer (FastAPI)]
    B --> C[PostGIS (Postgres)]
    B --> D[Qdrant Vector Index]
    B --> E[Cloudflare R2 Storage]
    B --> F[Gemini Flash AI]
    
    subgraph Client
        A1[React + Leaflet/MapLibre]
        A2[Map Interaction]
        A3[Post Composition UI]
        A4[Viewport-based Queries]
    end
    
    subgraph API Layer
        B1[Request Validation]
        B2[Auth (College Email)]
        B3[Rate Limiting]
        B4[Orchestration]
    end
    
    subgraph Data Layer
        C1[Canonical Post Store]
        C2[Geo-coordinates]
        C3[Spatial Queries]
    end
    
    subgraph AI Layer
        D1[Semantic Search]
        D2[Auto-tagging]
        D3[Grounded Q&A]
    end
    
    subgraph Storage
        E1[Image Storage Only]
    end
```

### Component Responsibilities & Boundaries

#### **Client (PWA - React + Leaflet/MapLibre)**
- **Owns**: Map interaction, post composition UI, viewport-based query triggering
- **Does NOT own**: Business logic around trust scoring, post decay/archival, moderation thresholds (handled server-side for security)

#### **API Layer (FastAPI)**
- **Owns**: Request validation, auth (college-email verification), rate limiting, orchestration between PostGIS and Qdrant on write
- **Boundary**: All writes (post creation, reports, edits) go through here - no direct client-to-DB access

#### **PostGIS (Postgres) - Source of Truth**
- **Owns**: Canonical store for posts, geo-coordinates, categories, timestamps, report counts
- **Critical Rule**: All spatial queries (radius search, bounding-box, clustering) happen here - **never** reimplement spatial logic in application code
- **Consistency Rule**: If PostGIS and Qdrant ever disagree, PostGIS wins. Qdrant is a derived/secondary index.

#### **Qdrant - Derived Index**
- **Owns**: Stores embeddings of post content for semantic search
- **Note**: Rebuildable from PostGIS at any time - treat as cache/index, not independent data requiring separate backup

#### **Gemini Flash - AI Layer (Scope-Limited)**
- **Owns**: Embedding generation, auto-tagging, grounded Q&A synthesis (per PRD FR9)
- **Constraint**: Grounded Q&A **must** cite source posts (FR10). No ungrounded generation shipped to users.
- **Scope Limit**: No open-ended chat, city-wide summarization, or predictive features in v1

#### **Cloudflare R2**
- **Owns**: Image storage only. Client uploads via signed URL, never routes image bytes through API server unnecessarily.

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as PWA Client
    participant API as API Layer
    participant PostGIS
    participant Qdrant
    participant R2 as Cloudflare R2
    participant AI as Gemini Flash
    
    %% Post Creation Flow
    User->>Client: Create post with text, optional image, category
    Client->>Client: Get GPS location (or manual pin)
    Client->>API: POST /posts (text, category, lat/lng, gps_verified, image_url?)
    API->>PostGIS: INSERT post with geography point
    API->>R2: Upload image (if provided)
    API->>AI: Generate embedding for post text
    AI-->>API: Return embedding vector
    API->>Qdrant: Store embedding with post ID reference
    API-->>Client: Return created post
    
    %% Map Browse Flow
    User->>Client: Open/move map
    Client->>API: GET /posts/nearby?lat=X&lng=Y&radius=2000
    API->>PostGIS: Spatial query (bounds + distance)
    PostGIS-->>API: Return nearby posts
    API-->>Client: Return posts for map display
    
    %% AI Query Flow
    User->>Client: Ask natural language question
    Client->>API: GET /ask?question=X&lat=Y&lng=Z
    API->>Qdrant: Semantic search for relevant posts
    Qdrant-->>API: Return relevant post IDs + similarity scores
    API->>PostGIS: Fetch full post data for IDs
    PostGIS-->>API: Return post details
    API->>AI: Generate grounded answer citing source posts
    AI-->>API: Return answer with citations
    API-->>Client: Return answer to display
```

## Core Features

### 1. Geo-tagged Post Creation
Users create posts that are anchored to specific geographic coordinates.

```mermaid
flowchart LR
    A[User Opens App] --> B{Location Source}
    B -->|GPS Available| C[Use Device GPS]
    B -->|GPS Unavailable| D[Manual Pin Drop]
    C --> E[Post Creation Form]
    D --> E
    E --> F[Text Input (280 chars)]
    E --> G[Optional Image Upload]
    E --> H[Category Selection]
    F & G & H --> I[Submit Post]
    I --> J[Validate Campus Boundary]
    J -->|Inside| K[Create Post Record]
    J -->|Outside| L[Show Error: Outside Campus]
    K --> M[Store in PostGIS]
    K --> N[Generate Embedding]
    K --> O[Store Image in R2]
    M & N & O --> P[Return Created Post]
```

### 2. Map-Based Discovery
Users browse nearby posts through an interactive map interface.

```mermaid
flowchart TD
    A[Map Viewport Change] --> B[Request Nearby Posts]
    B --> C{Zoom Level < 16?}
    C -->|Yes| D[Cluster Posts]
    C -->|No| E[Show Individual Pins]
    D --> F[Return Clustered Data]
    E --> F
    F --> G[Render Map View]
    G --> H{User Clicks Pin/Cluster}
    H -->|Pin| I[Show Post Details]
    H -->|Cluster| J[Show Cluster Summary]
```

### 3. AI-Powered "Ask the Map"
Users ask natural-language questions about their surroundings.

```mermaid
flowchart LR
    A[User Asks Question] --> B[Extract Location from Map Viewport]
    B --> C[Generate Query Embedding]
    C --> D[Search Qdrant for Similar Posts]
    D --> E[Fetch Full Post Data from PostGIS]
    E --> F[Generate Grounded Answer with Citations]
    F --> G[Return Answer + Source Posts]
    G --> H[Display Answer with Source Links]
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + Vite | UI framework |
| | Leaflet/MapLibre | Interactive maps |
| | TypeScript | Type safety |
| **Backend** | FastAPI | High-performance API |
| | Python 3.11+ | Backend language |
| **Database** | PostgreSQL + PostGIS | Primary data store + spatial queries |
| | Qdrant | Vector similarity search |
| **Storage** | Cloudflare R2 | Image/object storage |
| **AI** | Gemini Flash (via API) | Embeddings, tagging, Q&A |
| **DevOps** | Docker Compose | Local development |
| | GitHub Actions | CI/CD (planned) |
| **Infrastructure** | Self-hosted PMTiles | Map tile serving |
| | Nginx | Reverse proxy (planned) |

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}
```

### Backend Dependencies
```toml
[packages]
fastapi = "^0.100.0"
uvicorn = "^0.23.0"
psycopg2-binary = "^2.9.0"
asyncpg = "^0.29.0"
geoalchemy2 = "^0.14.0"
qdrant-client = "^1.5.0"
google-generativeai = "^0.3.0"
python-dotenv = "^1.0.0"
```

## Setup & Installation

> 📘 **Detailed Guide**: For a step-by-step guide including OS-specific instructions (Windows/macOS/Linux), migration options, API testing, and troubleshooting, see [HOW_TO_RUN.md](file:///d:/New%20folder%20%284%29/App/HOW_TO_RUN.md).

### Prerequisites
- Docker & Docker Compose
- Node.js >= 18
- Python >= 3.11
- PostgreSQL with PostGIS extension
- Gemini API key

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/georag.git
cd georag
```

#### 2. Set Up Environment Variables
```bash
# Backend
cp server/.env.example server/.env
# Edit .env with your values:
# DATABASE_URL=postgresql://georag:georag@localhost:5432/georag
# GEMINI_API_KEY=your_key_here
# CORS_ORIGINS=http://localhost:5173

# Frontend
cp client/.env.example client/.env
# Edit .env with:
# VITE_API_BASE_URL=http://localhost:8000
```

#### 3. Start PostGIS Database
```bash
docker compose -f infra/docker-compose.yml up -d db
```

#### 4. Initialize Database Schema
```bash
psql postgresql://georag:georag@localhost:5432/georag -f server/db/migrations/001_init.sql
```

#### 5. Start Backend Server
```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### 6. Start Frontend Development Server
```bash
cd client
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Documentation

### Posts Endpoints

#### Create a Post
```http
POST /posts
Content-Type: application/json

{
  "text": "Lost my red backpack near the library!",
  "category": "Lost&Found",
  "public_lat": 30.3550,
  "public_lng": 76.4500,
  "gps_verified": true,
  "image_url": "https://example.com/image.jpg"
}
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "text": "Lost my red backpack near the library!",
  "category": "Lost&Found",
  "public_lat": 30.3550,
  "public_lng": 76.4500,
  "gps_verified": true,
  "image_url": "https://example.com/image.jpg",
  "created_at": "2026-07-23T10:30:00Z",
  "expires_at": "2026-07-30T10:30:00Z"
}
```

#### Get Nearby Posts
```http
GET /posts/nearby?lat=30.3550&lng=76.4500&radius_m=2000&limit=100
```

Response:
```json
{
  "posts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "Lost my red backpack near the library!",
      "category": "Lost&Found",
      "public_lat": 30.3550,
      "public_lng": 76.4500,
      "gps_verified": true,
      "image_url": "https://example.com/image.jpg",
      "created_at": "2026-07-23T10:30:00Z",
      "expires_at": "2026-07-30T10:30:00Z"
    }
  ]
}
```

### AI Query Endpoint (Planned for Future)
```http
GET /ask?question=Where%20can%20I%20find%20good%20coffee%20near%20the%20engineering%20building&lat=30.3550&lng=76.4500
```

Response:
```json
{
  "answer": "Based on recent posts, the best coffee spots near the engineering building are: 1) Cafe Bliss (200m west) - mentioned 3 times today, 2) Campus Brew (350m north) - highly rated for afternoon study sessions",
  "sources": [
    {
      "id": "post1",
      "text": "Just tried Cafe Bliss - amazing cappuccino!",
      "category": "Recommendation",
      "distance_m": 200
    },
    {
      "id": "post2",
      "text": "Campus Brew has great quiet corners for studying",
      "category": "Recommendation",
      "distance_m": 350
    }
  ]
}
```

## Data Model

### Post Entity
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text VARCHAR(280) NOT NULL CHECK (char_length(trim(text)) > 0),
    category post_category NOT NULL,
    public_location geography(Point, 4326) NOT NULL,
    gps_verified BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
    is_hidden BOOLEAN NOT NULL DEFAULT false
);

CREATE TYPE post_category AS ENUM (
    'Safety',
    'Recommendation',
    'Lost&Found',
    'Event',
    'General'
);
```

### Spatial Indexes
```sql
CREATE INDEX IF NOT EXISTS posts_public_location_gix
    ON posts USING gist (public_location);

CREATE INDEX IF NOT EXISTS posts_visible_created_at_idx
    ON posts (created_at DESC)
    WHERE is_hidden = false;
```

### Constraints
- **Campus Boundary**: All posts must be within Punjabi University, Patiala bounds
  ```
  ST_Covers(
    ST_MakeEnvelope(76.4390, 30.3500, 76.4620, 30.3650, 4326),
    public_location::geometry
  )
  ```
- **Text Length**: 1-280 characters (trimmed)
- **Report Count**: Non-negative integer
- **Category**: Must be valid post_category enum value

## Spatial Queries

All geographic queries are handled by PostGIS to ensure accuracy and performance.

### Nearby Posts Query (used in `/posts/nearby` endpoint)
```sql
SELECT 
    id,
    text,
    category,
    ST_Y(public_location::geometry) AS public_lat,
    ST_X(public_location::geometry) AS public_lng,
    gps_verified,
    image_url,
    created_at,
    expires_at
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
```

## AI Features

### Embedding Generation
- Uses Gemini Flash to generate semantic embeddings for post text
- Enables similarity-based search in Qdrant vector database
- Embeddings are 768-dimensional vectors

### Auto-tagging
- Automatically suggests category tags for posts when user doesn't select one
- Uses Gemini Flash to analyze text content and predict appropriate category
- Constrained to the 5 predefined categories: Safety, Recommendation, Lost&Found, Event, General

### Grounded Q&A Synthesis
- Generates natural language answers to location-based questions
- **Critically**: Always cites specific source posts used to generate the answer
- Prevents hallucination by grounding responses in actual user-generated content
- Limited to posts within current map viewport for locality

## Deployment

### Production Deployment Checklist
1. [ ] Set up production PostgreSQL with PostGIS extension
2. [ ] Configure Cloudflare R2 bucket for image storage
3. [ ] Obtain Gemini API key with sufficient quota
4. [ ] Configure domain and SSL certificates
5. [ ] Set up CI/CD pipeline (GitHub Actions recommended)
6. [ ] Configure monitoring and logging (Prometheus/Grafana suggested)
7. [ ] Set up automated backups for PostGIS database
8. [ ] Configure rate limiting and DDoS protection
9. [ ] Deploy with Docker Compose or Kubernetes
10. [ ] Configure CDN for static assets (optional but recommended)

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:password@host:5432/database
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGINS=https://yourdomain.com
PORT=8000
ENVIRONMENT=production

# Frontend (.env)
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Docker Deployment
```bash
# Build and start all services
docker compose -f infra/docker-compose.yml up -d

# View logs
docker compose -f infra/docker-compose.yml logs -f

# Stop all services
docker compose -f infra/docker-compose.yml down
```

## Contributing

We welcome contributions to improve GeoRAG! Please follow these guidelines:

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Write tests for new functionality
- Update documentation as needed
- Ensure all spatial queries use PostGIS (never reimplement in application code)
- Respect AI scope limitations (no open-ended chat or city-wide features)
- Maintain campus boundary constraints for all geo-operations

### Reporting Issues
Please use the GitHub issue tracker to report bugs or request features. Include:
- Clear description of the issue
- Steps to reproduce (if applicable)
- Expected vs actual behavior
- Screenshots or logs if relevant

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*GeoRAG is a solo-founder project by Ayan Kumar. Built with ♥ for Punjabi University, Patiala community.*

*Last updated: July 23, 2026*