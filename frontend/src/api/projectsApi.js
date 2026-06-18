/**
 * projectsApi.js
 *
 * CRUD for the `projects` Supabase table.
 * Image uploads go to Supabase Storage bucket: "projects"
 *
 * Table columns (snake_case):
 *   id, program_type, title, amount_of_assistance, beneficiary,
 *   contact_person, brief_description, description, project_status,
 *   latitude, longitude, images (text[]),
 *   created_at, updated_at
 *
 * The frontend still uses camelCase objects — toRow() / fromRow() convert.
 */

import { supabase, uploadFile, deleteFile } from "./client";

const TABLE = "projects";
const FOLDER = "projects";

// ── Shape converters ──────────────────────────────────────────────────────────

/** Supabase row → camelCase object used by the React components */
function fromRow(row) {
  return {
    id: row.id,
    programType: row.program_type,
    title: row.title,
    amountOfAssistance: row.amount_of_assistance ?? "",
    beneficiary: row.beneficiary,
    contactPerson: row.contact_person ?? "",
    briefDescription: row.brief_description ?? "",
    description: row.description ?? "",
    projectStatus: row.project_status,
    location: {
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    },
    images: Array.isArray(row.images) ? row.images : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** camelCase payload → Supabase row (insert / update) */
function toRow(payload) {
  return {
    program_type: payload.programType ?? "",
    title: payload.title ?? "",
    amount_of_assistance: payload.amountOfAssistance ?? "",
    beneficiary: payload.beneficiary ?? "",
    contact_person: payload.contactPerson ?? "",
    brief_description: payload.briefDescription ?? "",
    description: payload.description ?? "",
    project_status: payload.projectStatus ?? "",
    latitude: payload.location?.latitude ?? null,
    longitude: payload.location?.longitude ?? null,
    // images are handled separately after upload
  };
}

// ── Upload helpers ────────────────────────────────────────────────────────────

async function uploadImages(files) {
  const urls = await Promise.all(
    files.map((f) => uploadFile(FOLDER, f)),
  );
  return urls;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all projects, newest first.
 *
 * @param {object} [options]
 * @param {boolean} [options.pinnedOnly]  - only rows with lat/lng set
 * @param {number}  [options.limit]       - max rows to return
 */
export async function fetchProjects(options = {}) {
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (options.pinnedOnly) {
    query = query
      .not("latitude", "is", null)
      .not("longitude", "is", null);
  }
  if (options.limit != null) {
    query = query.limit(Number(options.limit));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

/**
 * Create a new project.
 * Pass `imageFiles: File[]` for new uploads.
 */
export async function createProject(payload) {
  const { imageFiles = [], ...rest } = payload;
  const files = Array.isArray(imageFiles) ? imageFiles.filter((f) => f instanceof File) : [];

  // Upload images first
  const uploadedUrls = files.length > 0 ? await uploadImages(files) : [];

  const row = { ...toRow(rest), images: uploadedUrls };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

/**
 * Update an existing project.
 *
 * @param {string} id
 * @param {object} payload
 * @param {string[]} [payload.keptImageUrls]  - existing URLs to keep
 * @param {File[]}   [payload.imageFiles]     - new files to upload
 */
export async function updateProject(id, payload) {
  const { imageFiles = [], keptImageUrls = [], ...rest } = payload;
  const files = Array.isArray(imageFiles) ? imageFiles.filter((f) => f instanceof File) : [];
  const kept = Array.isArray(keptImageUrls) ? keptImageUrls : [];

  // Fetch current images to detect which ones were removed
  const { data: current, error: fetchError } = await supabase
    .from(TABLE)
    .select("images")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const oldUrls = Array.isArray(current?.images) ? current.images : [];
  const removedUrls = oldUrls.filter((u) => !kept.includes(u));

  // Upload new files
  const newUrls = files.length > 0 ? await uploadImages(files) : [];

  // Delete removed images from storage (best-effort)
  await Promise.all(removedUrls.map((u) => deleteFile(u)));

  const row = { ...toRow(rest), images: [...kept, ...newUrls] };

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
 * Delete a project and all its storage images.
 */
export async function deleteProject(id) {
  // Fetch images first for cleanup
  const { data: row } = await supabase
    .from(TABLE)
    .select("images")
    .eq("id", id)
    .single();

  const urls = Array.isArray(row?.images) ? row.images : [];
  await Promise.all(urls.map((u) => deleteFile(u)));

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
