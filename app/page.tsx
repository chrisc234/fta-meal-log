"use client";
// filepath: c:\Users\casan\fta-meal-log\app\page.tsx
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Meal = {
  id: string;
  name: string;
  time: string;
  date: string;
};

function getCurrentTime() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}
function getTodayDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
function addDays(date: string, numberOfDays: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + numberOfDays);
  return result.toISOString().slice(0, 10);
}
function getSunday(date: string) {
  const dateAtNoonUtc = new Date(`${date}T12:00:00Z`);
  return addDays(date, -dateAtNoonUtc.getUTCDay());
}
function formatDate(date: string) {
  const dateObject = new Date(`${date}T12:00:00Z`);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dateObject);
}
export default function Home() {
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealsLoaded, setMealsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingWeek, setIsClearingWeek] = useState(false);
  const [error, setError] = useState("");
  const [mealName, setMealName] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [weekStart, setWeekStart] = useState("");

  useEffect(() => {
    const today = getTodayDate();
    setSelectedDate(today);
    setWeekStart(getSunday(today));
    setMealTime(getCurrentTime());
  }, []);

  useEffect(() => {
    if (!weekStart) return;

    let active = true;
    async function loadMeals() {
      setMealsLoaded(false);
      setError("");
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: loadError } = await supabase
          .from("meals")
          .select("id, name, meal_date, meal_time")
          .gte("meal_date", weekStart)
          .lte("meal_date", addDays(weekStart, 6))
          .order("meal_date", { ascending: true })
          .order("meal_time", { ascending: true });

        if (loadError) throw loadError;
        if (active) {
          setMeals(
            data.map((meal) => ({
              id: meal.id,
              name: meal.name,
              date: meal.meal_date,
              time: meal.meal_time.slice(0, 5),
            })),
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load meals from Supabase.",
          );
        }
      } finally {
        if (active) setMealsLoaded(true);
      }
    }

    void loadMeals();
    return () => {
      active = false;
    };
  }, [weekStart]);

  async function addMeal() {
    if (!mealName.trim()) return;

    setIsSaving(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const mealValues = {
        name: mealName.trim(),
        meal_date: selectedDate,
        meal_time: mealTime,
      };
      const request = editingMeal
        ? supabase
            .from("meals")
            .update(mealValues)
            .eq("id", editingMeal.id)
        : supabase.from("meals").insert(mealValues);
      const { data, error: saveError } = await request
        .select("id, name, meal_date, meal_time")
        .single();

      if (saveError) throw saveError;
      const savedMeal: Meal = {
        id: data.id,
        name: data.name,
        date: data.meal_date,
        time: data.meal_time.slice(0, 5),
      };
      setMeals((currentMeals) => {
        const updatedMeals = editingMeal
          ? currentMeals.map((meal) =>
              meal.id === savedMeal.id ? savedMeal : meal,
            )
          : [...currentMeals, savedMeal];
        return updatedMeals.sort(
          (first, second) =>
            first.date.localeCompare(second.date) ||
            first.time.localeCompare(second.time),
        );
      });
      setMealName("");
      setMealTime(getCurrentTime());
      setEditingMeal(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save meal to Supabase.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMeal(meal: Meal) {
    if (!window.confirm(`Delete "${meal.name}"?`)) return;
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("meals")
        .delete()
        .eq("id", meal.id);
      if (deleteError) throw deleteError;
      setMeals((currentMeals) =>
        currentMeals.filter((currentMeal) => currentMeal.id !== meal.id),
      );
      if (editingMeal?.id === meal.id) {
        setEditingMeal(null);
        setMealName("");
        setMealTime(getCurrentTime());
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete meal from Supabase.",
      );
    }
  }

  async function clearWeek() {
    if (!weekStart || meals.length === 0 || isClearingWeek) return;

    const weekEnd = addDays(weekStart, 6);
    const weekLabel = `${formatDate(weekStart)} through ${formatDate(weekEnd)}`;
    if (
      !window.confirm(
        `Delete all ${meals.length} meal${meals.length === 1 ? "" : "s"} from ${weekLabel}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setIsClearingWeek(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: clearError } = await supabase
        .from("meals")
        .delete()
        .gte("meal_date", weekStart)
        .lte("meal_date", weekEnd);
      if (clearError) throw clearError;

      setMeals([]);
      if (editingMeal) {
        setEditingMeal(null);
        setMealName("");
        setMealTime(getCurrentTime());
      }
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Could not clear this week from Supabase.",
      );
    } finally {
      setIsClearingWeek(false);
    }
  }

  const selectedMeals = meals.filter((meal) => meal.date === selectedDate);
  const weekDates = weekStart
    ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
    : [];
  return (
      <main className="mx-auto min-h-screen max-w-2xl bg-gray-50 p-4 text-gray-900 sm:p-6">
      <h1 className="text-3xl font-bold">Meal Log</h1>
      <p className="mt-2 text-gray-600">
        Keep track of what you eat today.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-800">
          Supabase error: {error}
        </p>
      )}
                  <div className="mt-6 mb-2 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={!weekStart}
          onClick={() => {
            const previousWeek = addDays(weekStart, -7);
            setWeekStart(previousWeek);
            setSelectedDate(previousWeek);
          }}
          className="min-h-11 rounded bg-white px-4"
          aria-label="Previous week"
        >
          ←
        </button>

       <span>
          Week of {weekStart ? formatDate(weekStart) : "Loading…"}
        </span>
         <button
          type="button"
          onClick={() => {
            const today = getTodayDate();
            setWeekStart(getSunday(today));
            setSelectedDate(today);
          }}
          className="min-h-11 rounded bg-white px-3 text-sm"
        >
          Today
        </button>

        <button
          type="button"
          disabled={!weekStart}
          onClick={() => {
            const nextWeek = addDays(weekStart, 7);
            setWeekStart(nextWeek);
            setSelectedDate(nextWeek);
          }}
          className="min-h-11 rounded bg-white px-4"
          aria-label="Next week"
        >
          →
        </button>
      </div>
            <nav aria-label="Days of the week" className="mt-6 grid grid-cols-7 gap-1">
        {weekDates.map((date) => {
          const dateObject = new Date(`${date}T12:00:00Z`);
          const dayName = new Intl.DateTimeFormat("en-US", {
            timeZone: "UTC",
            weekday: "short",
          }).format(dateObject);
          const dayNumber = dateObject.getUTCDate();
          const isSelected = date === selectedDate;

          return (
            <button
              key={date}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedDate(date)}
              className={`min-h-11 rounded text-sm ${
                isSelected ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {dayName}
              <br />
              {dayNumber}
            </button>
          );
        })}
      </nav>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={!mealsLoaded || meals.length === 0 || isClearingWeek}
          onClick={() => void clearWeek()}
          className="min-h-11 rounded px-3 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isClearingWeek ? "Clearing week…" : "Clear this week"}
        </button>
      </div>

      <section className="mt-8 rounded-lg bg-white p-4 shadow-sm">
         <h2 className="text-xl font-semibold">
          Meals for {selectedDate ? formatDate(selectedDate) : "today"}
        </h2>
        {!mealsLoaded ? (
  <p className="mt-4 text-gray-600">Loading meals…</p>
) : selectedMeals.length === 0 ? (
          <p className="mt-4 text-gray-600">Nothing logged yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {selectedMeals.map((meal) => (
              <li
                key={meal.id}
                 className="flex flex-col gap-2 border-b py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  {meal.time} — {meal.name}
                </span>
                  <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMeal(meal);
                      setMealName(meal.name);
                      setMealTime(meal.time);
                    }}
                    className="min-h-11 rounded bg-white px-3"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                     onClick={() => void deleteMeal(meal)}
                    className="min-h-11 rounded bg-white px-3 text-red-600"
                    aria-label={`Delete ${meal.name}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form 
        onSubmit={(event) => {
          event.preventDefault();
          void addMeal();
        }}
        className="mt-6 rounded-lg bg-white p-4 shadow-sm"
      >
        
        <h2 className="text-xl font-semibold">
          {editingMeal ? "Edit meal" : "Add a meal"}
        </h2>

        <label htmlFor="meal-name" className="mt-4 block">
          What did you eat?
        </label>
        <input
          id="meal-name"
         type="text"
          required
          value={mealName}
          onChange={(event) => setMealName(event.target.value)}
          placeholder="For example, 2 sandwiches"
          className="mt-2 w-full rounded border p-3 text-base"
        />


        <label htmlFor="meal-time" className="mt-4 block">
          When did you eat it?
        </label>
        <input
          id="meal-time"
          type="time"
          required
          value={mealTime}
          onChange={(event) => setMealTime(event.target.value)}
          className="mt-2 w-full rounded border p-3 text-base"
        />

        <button
          type="submit"
          disabled={isSaving}
          className="mt-4 min-h-11 rounded bg-blue-600 px-5 text-white"
        >
            {isSaving
              ? "Saving…"
              : editingMeal
                ? "Save changes"
                : "Add meal"}
        </button>
           {editingMeal && (
          <button
            type="button"
            onClick={() => {
              setEditingMeal(null);
              setMealName("");
              setMealTime(getCurrentTime());
            }}
            className="mt-4 ml-2 min-h-11 rounded bg-gray-200 px-5"
          >
            Cancel
          </button>
        )}
      </form>
    </main>
  );
}