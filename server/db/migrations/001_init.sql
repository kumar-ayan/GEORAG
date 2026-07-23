CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_category') THEN
        CREATE TYPE post_category AS ENUM (
            'Safety',
            'Recommendation',
            'Lost&Found',
            'Event',
            'General'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text varchar(280) NOT NULL CHECK (char_length(trim(text)) > 0),
    category post_category NOT NULL,
    public_location geography(Point, 4326) NOT NULL,
    gps_verified boolean NOT NULL DEFAULT true,
    image_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    report_count integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
    is_hidden boolean NOT NULL DEFAULT false
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'posts_public_location_punjabi_university_chk'
    ) THEN
        ALTER TABLE posts
        ADD CONSTRAINT posts_public_location_punjabi_university_chk
        CHECK (
            ST_Covers(
                ST_MakeEnvelope(76.4390, 30.3500, 76.4620, 30.3650, 4326),
                public_location::geometry
            )
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS posts_public_location_gix
    ON posts
    USING gist (public_location);

CREATE INDEX IF NOT EXISTS posts_visible_created_at_idx
    ON posts (created_at DESC)
    WHERE is_hidden = false;
