# Habit Check

A simple iPhone-friendly productivity checklist app built as a web app.

## Supabase setup

This app loads Supabase settings from `supabaseConfig.js`.

For a static deployment such as Vercel, `supabaseConfig.js` must be included in the repo so the browser can load your public Supabase URL and anon key at runtime. The setup script will normalize a pasted REST URL such as `https://your-project.supabase.co/rest/v1/` to the project URL expected by the Supabase client.

To actually sync checklist data, create this table in the Supabase SQL editor:

```sql
create table if not exists public.habit_states (
	device_id text primary key,
	state jsonb not null,
	updated_at timestamptz not null default timezone('utc', now())
);

alter table public.habit_states enable row level security;

create policy "habit_check_anon_rw"
on public.habit_states
for all
using (true)
with check (true);
```

This policy is intentionally simple so a personal app can start syncing immediately with the anonymous key. If you want stronger privacy, add Supabase Auth and replace that policy with user-scoped rules.

## Run locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.
