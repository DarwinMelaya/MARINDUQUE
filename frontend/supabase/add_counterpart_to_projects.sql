-- Migration: add counterpart fields to the `projects` table
-- Run this in Supabase → SQL Editor

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS counterpart_name   text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS counterpart_amount text NOT NULL DEFAULT '';
