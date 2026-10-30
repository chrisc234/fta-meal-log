import "server-only";

import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export type MealInput = {
  name?: unknown;
  meal_date?: unknown;
  meal_time?: unknown;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export function authorizeRequest(request: Request) {
  const expectedPasscode = process.env.APP_PASSCODE;
  if (!expectedPasscode) {
    return jsonError("The app passcode is not configured on the server.", 503);
  }

  const providedPasscode = request.headers.get("x-app-passcode");
  if (!providedPasscode) {
    return jsonError("A valid passcode is required.", 401);
  }

  const expected = Buffer.from(expectedPasscode);
  const provided = Buffer.from(providedPasscode);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return jsonError("A valid passcode is required.", 401);
  }

  return null;
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured on the server.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function getWeekStart(value: string | null) {
  if (!isValidDate(value)) return null;
  return new Date(`${value}T12:00:00Z`).getUTCDay() === 0 ? value : null;
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function isMealName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 300;
}

export function isMealTime(value: unknown): value is string {
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours < 24 && minutes < 60;
}

export async function readJsonObject(
  request: Request,
): Promise<
  { ok: true; value: MealInput } | { ok: false; error: string }
> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return { ok: false, error: "Request body must be valid JSON." };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  return { ok: true, value: value as MealInput };
}

export function databaseError(action: string, error: unknown) {
  console.error(`Meal API failed to ${action}:`, error);
  return jsonError(`Could not ${action}. Please try again.`, 500);
}
