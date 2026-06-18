/**
 * coralReefsApi.js
 *
 * CRUD for the `coral_reefs` Supabase table.
 * Photo uploads go to Supabase Storage bucket: "coral-reefs"
 *
 * Table columns (snake_case):
 *   id, coral_name, coral_type, reef_structure, description, coral_status,
 *   latitude, longitude,
 *   area_coordinates (jsonb: [{latitude, longitude}]),
 *   photos (text[]),
 *   created_at, updated_at
 *
 * Components still receive camelCase — fromRow() / toRow() convert.
 */

import { supabase, uploadFile, deleteFile } from "./client";

const TABLE = "coral_reefs";
const FOLDER = "coral-reefs";
const MAX_PHOTOS = 3;

// ── Shape converters ──────────────────────────────────────────────────────────

function fromRow(row) {
  return {
    id: row.id,
    coralName: row.coral_name,
    coralType: row.coral_type,
    reefStructure: row.reef_structure ?? "CNU",
    description: row.description ?? "",
    coralStatus: row.coral_status,
    location: {
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    },
    areaCoordinates: Array.isArray(row.area_coordinates) ? row.area_coordinates : [],
    photos: Array.isArray(row.photos) ? row.photos : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(payload) {
  return {
    coral_name: payload.coralName ?? "",
    coral_type: payload.coralType ?? "",
    reef_structure: payload.reefStructure ?? "CNU",
    description: payload.description ?? "",
    coral_status: payload.coralStatus ?? "",
    latitude: payload.location?.latitude ?? null,
    longitude: payload.location?.longitude ?? null,
    area_coordinates: Array.isArray(payload.areaCoordinates)
      ? payload.areaCoordinates
      : [],
    // photos handled separately after upload
  };
}

// ── Upload helpers ────────────────────────────────────────────────────────────

async function uploadPhotos(files) {
  const limited = files.slice(0, MAX_PHOTOS);
  return Promise.all(limited.map((f) => uploadFile(FOLDER, f)));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all coral reefs, newest first.
 */
export async function fetchCoralReefs() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromRow);
}

/**
 * Create a coral reef entry.
 *
 * @param {object} payload
 * @param {File[]} [payload.photoFiles]  - up to 3 new photo files
 */
export async function createCoralReef(payload) {
  const { photoFiles = [], ...rest } = payload;
  const files = Array.isArray(photoFiles)
    ? photoFiles.filter((f) => f instanceof File)
    : [];

  const uploadedPhotos = files.length > 0 ? await uploadPhotos(files) : [];

  const row = { ...toRow(rest), photos: uploadedPhotos };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

/**
 * Update a coral reef.
 *
 * @param {string} id
 * @param {object} payload
 * @param {string[]} [payload.keptPhotoUrls]  - existing URLs to keep
 * @param {File[]}   [payload.photoFiles]     - new photo files to upload
 */
export async function updateCoralReef(id, payload) {
  const { photoFiles = [], keptPhotoUrls = [], ...rest } = payload;
  const files = Array.isArray(photoFiles)
    ? photoFiles.filter((f) => f instanceof File)
    : [];
  const kept = Array.isArray(keptPhotoUrls) ? keptPhotoUrls : [];

  // Detect removed photos
  const { data: current, error: fetchError } = await supabase
    .from(TABLE)
    .select("photos")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const oldPhotos = Array.isArray(current?.photos) ? current.photos : [];
  const removedPhotos = oldPhotos.filter((u) => !kept.includes(u));

  await Promise.all(removedPhotos.map((u) => deleteFile(u)));

  const newPhotos = files.length > 0 ? await uploadPhotos(files) : [];

  const row = { ...toRow(rest), photos: [...kept, ...newPhotos] };

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
 * Delete a coral reef entry and its photos from storage.
 */
export async function deleteCoralReef(id) {
  const { data: row } = await supabase
    .from(TABLE)
    .select("photos")
    .eq("id", id)
    .single();

  const photos = Array.isArray(row?.photos) ? row.photos : [];
  await Promise.all(photos.map((u) => deleteFile(u)));

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
