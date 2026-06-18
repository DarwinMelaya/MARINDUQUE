-- Migration: add `address` column to the `projects` table
-- Run this in Supabase → SQL Editor

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
