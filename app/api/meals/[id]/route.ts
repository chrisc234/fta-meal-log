import {
  authorizeRequest,
  databaseError,
  getSupabaseAdmin,
  isMealName,
  isMealTime,
  isUuid,
  isValidDate,
  jsonError,
  readJsonObject,
} from "@/lib/meals-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const unauthorized = authorizeRequest(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  if (!isUuid(id)) return jsonError("A valid meal id is required.", 400);

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const update: { name?: string; meal_date?: string; meal_time?: string } = {};
  const { name, meal_date: mealDate, meal_time: mealTime } = parsed.value;

  if (name !== undefined) {
    if (!isMealName(name)) {
      return jsonError("name must contain 1 to 300 characters.", 400);
    }
    update.name = name.trim();
  }
  if (mealDate !== undefined) {
    if (!isValidDate(mealDate)) {
      return jsonError("meal_date must be a valid YYYY-MM-DD date.", 400);
    }
    update.meal_date = mealDate;
  }
  if (mealTime !== undefined) {
    if (!isMealTime(mealTime)) {
      return jsonError("meal_time must be a valid 24-hour time such as 08:15.", 400);
    }
    update.meal_time = mealTime;
  }
  if (Object.keys(update).length === 0) {
    return jsonError("Provide a meal name, date, or time to update.", 400);
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("meals")
      .update(update)
      .eq("id", id)
      .select("id, name, meal_date, meal_time")
      .maybeSingle();
    if (error) return databaseError("update meal", error);
    if (!data) return jsonError("Meal not found.", 404);
    return Response.json(
      { meal: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return databaseError("update meal", error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const unauthorized = authorizeRequest(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  if (!isUuid(id)) return jsonError("A valid meal id is required.", 400);

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("meals")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return databaseError("delete meal", error);
    if (!data) return jsonError("Meal not found.", 404);
    return Response.json(
      { deleted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return databaseError("delete meal", error);
  }
}
