-- Migration: add `description` column to the `projects` table
-- Run this in Supabase → SQL Editor

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
