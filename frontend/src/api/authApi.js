/**
 * authApi.js
 *
 * Admin authentication — direct Supabase queries against the `admins` table.
 * Passwords are hashed with bcryptjs entirely in the browser
 * (no backend required).
 *
 * Table: admins  (id, name, email, password_hash, created_at, updated_at)
 *
 * NOTE: This approach stores a bcrypt hash and compares it client-side.
 *       For a production system you would move password verification to a
 *       Supabase Edge Function so the hash is never sent to the browser.
 *       For this project the backend is being removed, so client-side bcrypt
 *       is the closest equivalent.
 */

import bcrypt from "bcryptjs";
import { supabase, ADMIN_TOKEN_KEY } from "./client";

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify admin credentials against the `admins` table.
 * Returns a plain session object that is stored in localStorage.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {{ token: string, admin: { id, name, email } }}
 */
export async function loginAdmin({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  // Fetch the admin row — password_hash is selected explicitly because it has
  // no `select: false` equivalent in Supabase; RLS + service-role restriction
  // should prevent public access to this table.
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, name, email, password_hash")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (error || !admin) {
    throw new Error("Invalid email or password.");
  }

  const matches = await bcrypt.compare(password, admin.password_hash);
  if (!matches) {
    throw new Error("Invalid email or password.");
  }

  // Build a lightweight session token (not a real JWT — just a signed string
  // the app uses to know who is logged in).
  const session = { id: admin.id, name: admin.name, email: admin.email };
  const token = btoa(JSON.stringify(session));

  return { token, admin: session };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-up
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new admin row.
 *
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {{ token: string, admin: { id, name, email } }}
 */
export async function signupAdmin({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  // Check for existing email
  const { data: existing } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: created, error } = await supabase
    .from("admins")
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
    })
    .select("id, name, email")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Could not create admin account.");
  }

  const session = { id: created.id, name: created.name, email: created.email };
  const token = btoa(JSON.stringify(session));

  return { token, admin: session };
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout helper
// ─────────────────────────────────────────────────────────────────────────────

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
