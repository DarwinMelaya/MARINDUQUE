-- =============================================================
-- Supabase SQL Schema
-- Converted from Mongoose models: Admin, Project, Announcement, CoralReef
-- =============================================================

-- ─────────────────────────────────────────
-- 1. ADMINS
-- Mirrors: backend/models/Admin.js
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  email       text        NOT NULL UNIQUE,
  password_hash text      NOT NULL,  -- store bcrypt hash; never expose via anon key
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER admins_set_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS: admins table should never be readable by the anon/public role
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only service-role (backend) may read/write admins
CREATE POLICY "Service role only" ON admins
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────
-- 2. PROJECTS
-- Mirrors: backend/models/Project.js
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type        text        NOT NULL CHECK (program_type IN ('GIA','CEST','SSCP','SETUP')),
  title               text        NOT NULL,
  amount_of_assistance text       NOT NULL DEFAULT '',
  beneficiary         text        NOT NULL,
  contact_person      text        NOT NULL DEFAULT '',
  brief_description   text        NOT NULL DEFAULT '',
  project_status      text        NOT NULL CHECK (project_status IN ('Ongoing','Graduated','Terminated')),
  -- Flat lat/lng columns (mirrors location.latitude / location.longitude)
  latitude            double precision DEFAULT NULL,
  longitude           double precision DEFAULT NULL,
  -- Array of public image URLs (Supabase Storage)
  images              text[]      NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects (created_at DESC);

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS: public can read; only service role (backend) can write
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Service role write projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────
-- 3. ANNOUNCEMENTS
-- Mirrors: backend/models/Announcement.js
-- images is an array of {url, alt} objects → stored as JSONB
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_label   text        NOT NULL DEFAULT 'Today''s highlight',
  title             text        NOT NULL DEFAULT '',
  subtitle          text        NOT NULL DEFAULT '',
  display_date      text        NOT NULL DEFAULT '',
  badge             text        NOT NULL DEFAULT '',
  carousel_caption  text        NOT NULL DEFAULT '',
  -- Arrays of simple strings
  body_paragraphs   text[]      NOT NULL DEFAULT '{}',
  hashtags          text[]      NOT NULL DEFAULT '{}',
  cta_label         text        NOT NULL DEFAULT '',
  cta_url           text        NOT NULL DEFAULT '',
  facebook_post_url text        NOT NULL DEFAULT '',
  -- Array of {url: string, alt: string} objects
  images            jsonb       NOT NULL DEFAULT '[]',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements (created_at DESC);

CREATE TRIGGER announcements_set_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read announcements" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Service role write announcements" ON announcements
  FOR ALL USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────
-- 4. CORAL REEFS
-- Mirrors: backend/models/CoralReef.js
-- areaCoordinates is [{latitude, longitude}] → stored as JSONB
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coral_reefs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coral_name       text        NOT NULL,
  coral_type       text        NOT NULL,
  reef_structure   text        NOT NULL DEFAULT 'CNU'
                               CHECK (reef_structure IN ('CNU','Reefblocks')),
  description      text        NOT NULL DEFAULT '',
  coral_status     text        NOT NULL
                               CHECK (coral_status IN ('Healthy','Bleached Damaged','Recovering','Dead')),
  -- Flat lat/lng for the marker pin
  latitude         double precision DEFAULT NULL,
  longitude        double precision DEFAULT NULL,
  -- Polygon / polygon ring: [{latitude, longitude}, ...]
  area_coordinates jsonb       NOT NULL DEFAULT '[]',
  -- Array of public photo URLs
  photos           text[]      NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coral_reefs_created_at_idx ON coral_reefs (created_at DESC);

CREATE TRIGGER coral_reefs_set_updated_at
  BEFORE UPDATE ON coral_reefs
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

ALTER TABLE coral_reefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read coral_reefs" ON coral_reefs
  FOR SELECT USING (true);

CREATE POLICY "Service role write coral_reefs" ON coral_reefs
  FOR ALL USING (auth.role() = 'service_role');
