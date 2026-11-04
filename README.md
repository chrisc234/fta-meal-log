# F-T-A




Application to track food eaten today
Product 1 Spec: Meal Log

First draft. Everything here comes from my own answers in the interview.

1. About Me (the User)

Who I am in this problem: I train for strength and stamina and I'm trying to be healthier, have better workouts, and know what is going on in my body. I know my daily protein and calorie numbers by heart. The only thing I'm missing is a record of what I've eaten.

Last 3 times it happened:

#	When and where	What went wrong	What it cost	What I did
1	October 8th, 2026. Planning dinner in the evening.	I didn't know what I could eat because I forgot what I had eaten earlier in the day.	10+ minutes of thinking and mental fatigue	Just ordered a pizza
2	October 12th, 2026. Checking my notes app to see whether I'd eaten breakfast.	I saw an entry from the previous day and thought it was today's, so I believed I had eaten breakfast.	Missed breakfast and lost 31g of protein	Had the small dinner I had planned, so I under-ate that day
3	October 1st, 2026. Writing down a meal in my notes.	I wrote down what I ate but wasn't sure how much of it (how many eggs).	Couldn't track my intake accurately that day, plus wasted energy and mental fatigue	Assumed 3 eggs and about 20g of protein

How often: At least 2 times a week, sometimes more. It's usually one forgotten meal, sometimes two. Breakfast is the meal that goes missing most. It doesn't matter whether the day was rushed or not.

What it costs me:

Time: 10 minutes or more each time, at least 2 times a week. That is 20+ minutes a week at minimum.
Energy: mental fatigue from thinking about it.
2. Problem Statement

Gut check: "I need my product because I plan without all the information."

Five Whys:

Why do I spend 10+ minutes on dinner? Because I can't tell what protein and calories I've already had today.
Why can't I tell? Because meals, mostly breakfast, never made it into my notes.
Why didn't they make it in? Because work, traffic, and responsibilities delay my eating, and by the time I eat I forget to write it down.
Why do I forget? Because logging is a separate step from eating, so I sometimes forget to go into my food note.
Why does a missing entry go unnoticed? Because my notes mix all my days and other topics in one list, so a gap looks the same as a full day.

Full problem statement:

When I'm planning dinner (at least 2 times a week), I struggle to tell what I've already eaten today, so I can't tell how much protein and how many calories I still need. This costs me 10+ minutes each time (20+ minutes a week at minimum), plus mental fatigue. On bad days it also costs me a meal: on October 12th I missed breakfast and lost 31g of protein, and I typically under-eat. This happens because work, responsibilities, and traffic delay my meals, so I forget to write them down, and logging is a separate step from eating. Right now I write what I eat in my notes app, but entries from different days pile up in one list and I also use notes for other things, so I have to scroll to find today, and a missing meal or an old entry can look like today's.

I'll know this is solved when:

I can see everything I've eaten today in under 10 seconds.
Deciding on dinner takes less than 5 minutes.
I can see what I ate today and how much of it, without guessing.

Moved out of scope for now: headaches (I decided they are unimportant for this), muscle gain (I haven't noticed it showing up), looking up macros and doing the math with a calculator.

3. Existing Solutions
What I use or tried	What it does well	Why it falls short for me
Notes app	It helped at first.	Entries stack up unless I delete them each day, so it's confusing to scroll through and time consuming. It also doesn't separate days or show when I ate.
CalAI	Manages my time entries better than notes, and it has a free mode.	The actions I want are behind a subscription, and I prefer to save money wherever I can.

The gap: I need to see what I ate each day, with the time and how many of each item (like "2 sandwiches"), without scrolling through a pile of old notes.

4. Features & Benefits
Feature	Benefit (in my life)	Stage
Type in any meal I ate, including how many (like "2 sandwiches")	Meals and amounts get written down instead of forgotten or guessed, so I can see my day when planning dinner	MVP
Put a time stamp on each meal	I know when I ate it, and I can fill in a meal I logged late	MVP
Calendar days Sunday to Saturday, one 7-day week at a time, and a week is only cleared when I choose	I find today's meals without scrolling through a pile of old entries, and I never lose a week by accident	MVP
Optional protein and calorie numbers on each meal	I can see how much I've had when planning dinner, without entering numbers when I'm busy	Later
Daily totals of protein and calories	I don't add things up by hand	Later

Not doing:

Reminders. I don't need to be reminded.
Looking up macros for foods.
Protein and calorie numbers for now. I'm logging what I ate, when, and how many first, and numbers come later.
Tracking anything besides meals.
Other users, sharing, or accounts for anyone but me.
Suggesting what to eat.
5. Tech Stack

I'm choosing a stack that matches the architecture spine (client → API → data → deploy) and is only as big as my MVP needs. The goal is to see my meals for today on my phone in under 10 seconds.

Piece	Choice	Why
Editor	VS Code (with an AI agent helping)	Free, has Git built in, and works well with JavaScript
Front end	Next.js (React) page, designed for a phone first	I log meals on my phone right after I eat, so it has to work on a small screen
Back end	Next.js API routes (files in app/api)	Front end and back end live in one project, so there is only one thing to build and deploy
Data	Supabase (PostgreSQL), free tier	Meals are saved online, so the same log shows on my phone and laptop. Vercel doesn't keep local files, so a file or SQLite won't work
Outside services	None	The MVP doesn't need AI, calendars, or accounts
Hosting	Vercel, deployed from my GitHub repo	Free, and gives me a link I can open in Safari and add to my Home Screen
Front end (what I see and tap)

One page, built for a phone, with three parts from top to bottom:

Week bar: seven buttons, Sunday to Saturday, for the current week, with today selected by default. Previous-week and next-week arrows change the week.
Day list: every meal for the selected day, sorted by time, showing the time and the text I typed (for example "8:15 AM, 3 eggs and toast"). Each meal has Edit and Delete. If the day is empty, it says "Nothing logged yet."
Add meal form: a text box for what I ate and how many (like "2 sandwiches"), a time field that defaults to now (so I can change it for a meal I'm logging late), and an Add button.

Front end rules:

Text boxes use a font size of 16px or larger so iPhone doesn't zoom in when I tap them.
Buttons are at least 44px tall so I can tap them one-handed.
"Today" is based on my own time zone (America/New_York), not UTC, so a late dinner doesn't land on tomorrow.
Nothing is deleted automatically. A week only goes away if I delete it (the "only cleared when I choose" part of the week-by-week feature).

Optional protein and calorie fields stay out of the page for the MVP (Later).

Back end (what runs behind the page)

Data: one meals table in Supabase

Column	Type	Notes
id	uuid	Primary key, generated automatically
name	text	What I ate and how many, like "2 sandwiches"
eaten_at	timestamptz	The date and time I ate it (this is my timestamp)
protein_g	integer, can be empty	Later
calories	integer, can be empty	Later
created_at	timestamptz	Set automatically; shows when I actually logged it

API routes (Next.js)

Route	What it does
GET /api/meals?week_start=YYYY-MM-DD	Returns all meals from that Sunday through Saturday, sorted by eaten_at
POST /api/meals	Adds a meal (name, eaten_at)
PATCH /api/meals/[id]	Edits a meal's name or time
DELETE /api/meals/[id]	Deletes one meal
DELETE /api/meals?week_start=YYYY-MM-DD	Resets (deletes) one whole week, only when I ask

Keeping it private: this is only for me, but anyone with the link could call the API. For the MVP, the page asks for a passcode once and stores it on my phone. The API checks it against an environment variable (APP_PASSCODE) and rejects requests without it. The Supabase keys (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) stay in environment variables on the server and are never put in front end code.

# Demo

App link: https://fta-meal-log.vercel.app/





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
