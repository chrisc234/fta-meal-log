# F · T · A Meal Log

A phone-first, private meal log for recording what you ate, how much, and when.
Meals are organized by Sunday-to-Saturday weeks and shown in the
`America/New_York` time zone.

## Set up the app

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql)
   in its SQL editor.
2. Copy `.env.example` to `.env.local` and fill in:
   - `APP_PASSCODE`: a private passcode for accessing the app.
   - `SUPABASE_URL`: the project URL from Supabase project settings.
   - `SUPABASE_SERVICE_ROLE_KEY`: the service-role key from Supabase API
     settings. Keep this value on the server; do not prefix it with `NEXT_PUBLIC_`.
3. Install dependencies and start the development server:

   ```sh
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and enter the app passcode.

The passcode is saved in this browser's local storage. The API requires it on
every request. The Supabase service-role key is used only by server-side API
handlers. The meals table has row-level security enabled and intentionally has
no public policies; the server's service-role client performs the requests.

## Features

- Browse days in a selected week; changing weeks never deletes data.
- Add, edit, and delete meals, including late entries with an adjustable time.
- Clear an entire week only after confirming the action.
- Persist meal data in Supabase so it is available across devices.
