/**
 * client.js
 *
 * Central Supabase client + shared auth/storage helpers.
 * All API modules (projectsApi, authApi, etc.) import from here.
 */

import supabase, { STORAGE_BUCKET } from "../utils/supabaseClient";
import { compressImage } from "../utils/compressImage";

export { supabase };

// ── Auth token key (used by Login / SignUp pages) ─────────────────────────────
export const ADMIN_TOKEN_KEY = "dost_admin_token";

/**
 * Returns the admin session stored in localStorage after login.
 * Shape: { id, name, email }
 */
export function getStoredAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    return null;
  }
}

/**
 * Human-readable error message from a Supabase error or plain Error.
 */
export function getApiErrorMessage(err, fallback = "Request failed.") {
  if (!err) return fallback;
  if (typeof err.message === "string" && err.message.trim()) {
    return err.message.trim();
  }
  if (typeof err.details === "string" && err.details.trim()) {
    return err.details.trim();
  }
  return fallback;
}

/**
 * Upload one file to Supabase Storage.
 * Uses the bucket defined by VITE_SUPABASE_STORAGE_BUCKET in .env
 *
 * @param {string} folder  - sub-folder inside the bucket (e.g. "projects", "coral-reefs")
 * @param {File}   file    - browser File object
 * @returns {Promise<string>} public URL
 */
export async function uploadFile(folder, file) {
  // Compress before upload — reduces MB photos to ≤ 800 KB JPEG
  const compressed = await compressImage(file);

  const ext  = compressed.name.split(".").pop();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, compressed, { upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its full public URL.
 * Silently ignores errors (best-effort cleanup).
 *
 * @param {string} publicUrl
 */
export async function deleteFile(publicUrl) {
  try {
    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch {
    // best-effort — don't crash the caller
  }
}
