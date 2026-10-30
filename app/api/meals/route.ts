import {
  authorizeRequest,
  databaseError,
  getSupabaseAdmin,
  getWeekStart,
  isMealName,
  isMealTime,
  isValidDate,
  jsonError,
  readJsonObject,
} from "@/lib/meals-api";

export async function GET(request: Request) {
  const unauthorized = authorizeRequest(request);
  if (unauthorized) return unauthorized;

  const weekStart = getWeekStart(
    new URL(request.url).searchParams.get("week_start"),
  );
  if (!weekStart) {
    return jsonError("week_start must be a valid Sunday in YYYY-MM-DD format.", 400);
  }

  const weekEnd = new Date(`${weekStart}T12:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const endDate = weekEnd.toISOString().slice(0, 10);

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("meals")
      .select("id, name, meal_date, meal_time")
      .gte("meal_date", weekStart)
      .lte("meal_date", endDate)
      .order("meal_date", { ascending: true })
      .order("meal_time", { ascending: true });
    if (error) return databaseError("load meals", error);
    return Response.json(
      { meals: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return databaseError("load meals", error);
  }
}

export async function POST(request: Request) {
  const unauthorized = authorizeRequest(request);
  if (unauthorized) return unauthorized;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const { name, meal_date: mealDate, meal_time: mealTime } = parsed.value;
  if (!isMealName(name)) {
    return jsonError("name must contain 1 to 300 characters.", 400);
  }
  if (!isValidDate(mealDate)) {
    return jsonError("meal_date must be a valid YYYY-MM-DD date.", 400);
  }
  if (!isMealTime(mealTime)) {
    return jsonError("meal_time must be a valid 24-hour time such as 08:15.", 400);
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("meals")
      .insert({
        name: name.trim(),
        meal_date: mealDate,
        meal_time: mealTime,
      })
      .select("id, name, meal_date, meal_time")
      .single();
    if (error) return databaseError("add meal", error);
    return Response.json(
      { meal: data },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return databaseError("add meal", error);
  }
}

export async function DELETE(request: Request) {
  const unauthorized = authorizeRequest(request);
  if (unauthorized) return unauthorized;

  const weekStart = getWeekStart(
    new URL(request.url).searchParams.get("week_start"),
  );
  if (!weekStart) {
    return jsonError("week_start must be a valid Sunday in YYYY-MM-DD format.", 400);
  }

  const weekEnd = new Date(`${weekStart}T12:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const endDate = weekEnd.toISOString().slice(0, 10);

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("meals")
      .delete()
      .gte("meal_date", weekStart)
      .lte("meal_date", endDate)
      .select("id");
    if (error) return databaseError("clear this week", error);
    return Response.json(
      { deleted: data.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return databaseError("clear this week", error);
  }
}
