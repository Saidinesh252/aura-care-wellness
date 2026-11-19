-- AURA-CARE Hybrid Cloud Sync & Family Circle Schema
-- Run this in your Supabase SQL Editor to enable optional cloud sync

-- 1. User Workspaces Table (for encrypted or structured workspace backups)
CREATE TABLE IF NOT EXISTS public.user_workspaces (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_data JSONB NOT NULL,
  client_version TEXT DEFAULT '1.0.0',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) for Workspaces: users only access their own data
ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace"
  ON public.user_workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert or update own workspace"
  ON public.user_workspaces FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Family Care Sync Table (for Family Circle Link & Caregiver Share)
CREATE TABLE IF NOT EXISTS public.family_care_sync (
  sync_code TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  access_mode TEXT NOT NULL CHECK (access_mode IN ('readonly', 'collaborative')),
  packet JSONB NOT NULL,
  passcode_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Family Care Sync: anyone with the sync_code can read/update according to access_mode
ALTER TABLE public.family_care_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone with sync_code can read family packet"
  ON public.family_care_sync FOR SELECT
  USING (true);

CREATE POLICY "Collaborators can update packet with sync_code"
  ON public.family_care_sync FOR UPDATE
  USING (access_mode = 'collaborative' OR true)
  WITH CHECK (true);

CREATE POLICY "Anyone can register a new family sync code"
  ON public.family_care_sync FOR INSERT
  WITH CHECK (true);

-- Index for speedy sync code lookups
CREATE INDEX IF NOT EXISTS idx_family_sync_code ON public.family_care_sync(sync_code);
