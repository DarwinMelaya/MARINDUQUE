/**
 * announcementsApi.js
 *
 * CRUD for the `announcements` Supabase table.
 * Image uploads go to Supabase Storage bucket: "announcements"
 *
 * Table columns (snake_case):
 *   id, highlight_label, title, subtitle, display_date, badge,
 *   carousel_caption, body_paragraphs (text[]), hashtags (text[]),
 *   cta_label, cta_url, facebook_post_url,
 *   images (jsonb: [{url, alt}]),
 *   created_at, updated_at
 *
 * Components still use camelCase — fromRow() / toRow() convert.
 */

import { supabase, uploadFile, deleteFile } from "./client";

const TABLE = "announcements";
const FOLDER = "announcements";

// ── Shape converters ──────────────────────────────────────────────────────────

function fromRow(row) {
  return {
    id: row.id,
    highlightLabel: row.highlight_label ?? "Today's highlight",
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    displayDate: row.display_date ?? "",
    badge: row.badge ?? "",
    carouselCaption: row.carousel_caption ?? "",
    bodyParagraphs: Array.isArray(row.body_paragraphs) ? row.body_paragraphs : [],
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    ctaLabel: row.cta_label ?? "",
    ctaUrl: row.cta_url ?? "",
    facebookPostUrl: row.facebook_post_url ?? "",
    images: Array.isArray(row.images) ? row.images : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(payload) {
  return {
    highlight_label: payload.highlightLabel ?? "Today's highlight",
    title: payload.title ?? "",
    subtitle: payload.subtitle ?? "",
    display_date: payload.displayDate ?? "",
    badge: payload.badge ?? "",
    carousel_caption: payload.carouselCaption ?? "",
    body_paragraphs: Array.isArray(payload.bodyParagraphs) ? payload.bodyParagraphs : [],
    hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : [],
    cta_label: payload.ctaLabel ?? "",
    cta_url: payload.ctaUrl ?? "",
    facebook_post_url: payload.facebookPostUrl ?? "",
    // images are set separately after upload
  };
}

// ── Upload helpers ────────────────────────────────────────────────────────────

/**
 * Upload image files and return [{url, alt}] objects.
 * `altTexts` is optional — defaults to empty string.
 */
async function uploadImages(files, altTexts = []) {
  const results = await Promise.all(
    files.map(async (f, i) => {
      const url = await uploadFile(FOLDER, f);
      return { url, alt: altTexts[i] ?? "" };
    }),
  );
  return results;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * The most recent announcement for the public landing page.
 */
export async function fetchFeaturedAnnouncement() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? fromRow(data) : null;
}

/**
 * All announcements, newest first (admin list).
 */
export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromRow);
}

/**
 * Create a new announcement.
 *
 * Accepts either:
 *  - A plain camelCase object (with optional `imageFiles: File[]` and `imageAlts: string[]`)
 *  - OR a FormData object (legacy — will be converted internally)
 *
 * @param {object|FormData} payload
 */
export async function createAnnouncement(payload) {
  const parsed = payload instanceof FormData ? formDataToObject(payload) : payload;
  const { imageFiles = [], imageAlts = [], ...rest } = parsed;
  const files = Array.isArray(imageFiles) ? imageFiles.filter((f) => f instanceof File) : [];

  const uploadedImages = files.length > 0 ? await uploadImages(files, imageAlts) : [];

  const row = { ...toRow(rest), images: uploadedImages };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

/**
 * Update an announcement.
 *
 * @param {string}        id
 * @param {object|FormData} payload
 *   keptImages:   [{url, alt}]  — existing image objects to keep
 *   imageFiles:   File[]        — new files to upload
 *   imageAlts:    string[]      — alt texts for new files
 */
export async function updateAnnouncement(id, payload) {
  const parsed = payload instanceof FormData ? formDataToObject(payload) : payload;
  const { imageFiles = [], imageAlts = [], keptImages = [], ...rest } = parsed;
  const files = Array.isArray(imageFiles) ? imageFiles.filter((f) => f instanceof File) : [];
  const kept = Array.isArray(keptImages) ? keptImages : [];

  // Detect removed images
  const { data: current, error: fetchError } = await supabase
    .from(TABLE)
    .select("images")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const oldImages = Array.isArray(current?.images) ? current.images : [];
  const keptUrls = kept.map((img) => img.url);
  const removedImages = oldImages.filter((img) => !keptUrls.includes(img.url));

  await Promise.all(removedImages.map((img) => deleteFile(img.url)));

  const newImages = files.length > 0 ? await uploadImages(files, imageAlts) : [];

  const row = { ...toRow(rest), images: [...kept, ...newImages] };

  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

/**
 * Delete an announcement and its storage images.
 */
export async function deleteAnnouncement(id) {
  const { data: row } = await supabase
    .from(TABLE)
    .select("images")
    .eq("id", id)
    .single();

  const images = Array.isArray(row?.images) ? row.images : [];
  await Promise.all(images.map((img) => deleteFile(img.url)));

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

// ── Utility: FormData → plain object (legacy compatibility) ───────────────────

function formDataToObject(fd) {
  const obj = {};
  for (const [key, value] of fd.entries()) {
    if (key === "images") {
      if (!obj.imageFiles) obj.imageFiles = [];
      if (value instanceof File) obj.imageFiles.push(value);
    } else if (key === "keptImagesJson") {
      try { obj.keptImages = JSON.parse(value); } catch { obj.keptImages = []; }
    } else if (key === "bodyParagraphs[]" || key === "bodyParagraphs") {
      if (!obj.bodyParagraphs) obj.bodyParagraphs = [];
      obj.bodyParagraphs.push(value);
    } else if (key === "hashtags[]" || key === "hashtags") {
      if (!obj.hashtags) obj.hashtags = [];
      obj.hashtags.push(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
