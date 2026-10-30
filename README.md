# F · T · A Meal Log

A phone-first, private meal log for recording what you ate, how much, and when.
Meals are organized by Sunday-to-Saturday weeks and shown in the
`America/New_York` time zone.

## Set up the app

1. Create the `meals` table in Supabase with `id`, `user_id`, `name`,
   `meal_date`, `meal_time`, and `created_at` columns. Enable row-level security.
2. Copy `.env.example` to `.env.local` and fill in:
   - `APP_PASSCODE`: a private passcode for accessing the app.
   - `SUPABASE_URL`: the project URL from Supabase project settings.
   - `SUPABASE_SERVICE_ROLE_KEY`: the secret/service-role key from Supabase
     project settings. Keep this value on the server; never prefix it with
     `NEXT_PUBLIC_` or expose it in browser code.
3. Install dependencies and start the development server:

   ```sh
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and enter the app passcode.

The passcode is saved in this browser's local storage. The API requires it on
every request. The Supabase service-role key is used only by server-side API
handlers. After verifying the server API, run this in the Supabase SQL Editor to
remove the public policies while leaving row-level security enabled:

```sql
drop policy if exists "Anyone can view meals" on public.meals;
drop policy if exists "Anyone can add meals" on public.meals;
drop policy if exists "Anyone can update meals" on public.meals;
drop policy if exists "Anyone can delete meals" on public.meals;
drop policy if exists "Users can view their own meals" on public.meals;
drop policy if exists "Users can add their own meals" on public.meals;
drop policy if exists "Users can update their own meals" on public.meals;
drop policy if exists "Users can delete their own meals" on public.meals;
```

Server API requests continue to work with the service-role key after these
public policies are removed. Never expose that key in browser code.

## Features

- Browse days in a selected week; changing weeks never deletes data.
- Add, edit, and delete meals, including late entries with an adjustable time.
- Clear an entire week only after confirming the action.
- Persist meal data in Supabase so it is available across devices.
