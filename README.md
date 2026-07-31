# Habit Check

A simple iPhone-friendly productivity checklist app built as a web app.

## Supabase setup

This app loads Supabase settings from `supabaseConfig.js`.

For a static deployment such as Vercel, `supabaseConfig.js` must be included in the repo so the browser can load your public Supabase URL and anon key at runtime. The setup script will normalize a pasted REST URL such as `https://your-project.supabase.co/rest/v1/` to the project URL expected by the Supabase client.

Enable the Email provider in Supabase Auth so members can create accounts with email and password. Email confirmation can be turned on or off depending on how strict you want signup to be.

If email confirmation is enabled, set your Site URL to your deployed app URL and add both your local and deployed auth pages to the Redirect URLs list, for example:

- `http://127.0.0.1:8001/login.html`
- `http://localhost:8000/login.html`
- `https://your-vercel-domain.vercel.app/login.html`

To store each member's checklist separately, use this table and row-level security in the Supabase SQL editor:

```sql
create table if not exists public.habit_states (
	device_id text primary key,
	state jsonb not null,
	updated_at timestamptz not null default timezone('utc', now())
);

alter table public.habit_states enable row level security;

drop policy if exists "habit_check_anon_rw" on public.habit_states;
drop policy if exists "habit_check_users_select_own" on public.habit_states;
drop policy if exists "habit_check_users_insert_own" on public.habit_states;
drop policy if exists "habit_check_users_update_own" on public.habit_states;

create policy "habit_check_users_select_own"
on public.habit_states
for select
to authenticated
using (auth.uid()::text = device_id);

create policy "habit_check_users_insert_own"
on public.habit_states
for insert
to authenticated
with check (auth.uid()::text = device_id);

create policy "habit_check_users_update_own"
on public.habit_states
for update
to authenticated
using (auth.uid()::text = device_id)
with check (auth.uid()::text = device_id);
```

This setup keeps one saved row per signed-in user. The app writes the authenticated user's Supabase auth ID into `device_id`, so each member gets isolated state without sharing a local device key.

## Run locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.
