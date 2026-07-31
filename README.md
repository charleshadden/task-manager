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

## Social features setup

To enable profile photos, following, and parties, add these tables and policies:

```sql
create table if not exists public.profiles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	display_name text not null,
	photo_url text,
	updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.follows (
	follower_id uuid not null references auth.users(id) on delete cascade,
	followee_id uuid not null references auth.users(id) on delete cascade,
	created_at timestamptz not null default timezone('utc', now()),
	primary key (follower_id, followee_id),
	check (follower_id <> followee_id)
);

create table if not exists public.parties (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid not null references auth.users(id) on delete cascade,
	name text not null,
	created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.party_members (
	party_id uuid not null references public.parties(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	joined_at timestamptz not null default timezone('utc', now()),
	primary key (party_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
drop policy if exists "profiles_write_own" on public.profiles;
create policy "profiles_read_all"
on public.profiles
for select
to authenticated
using (true);
create policy "profiles_write_own"
on public.profiles
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "follows_read_all" on public.follows;
drop policy if exists "follows_write_own" on public.follows;
create policy "follows_read_all"
on public.follows
for select
to authenticated
using (true);
create policy "follows_write_own"
on public.follows
for all
to authenticated
using (auth.uid() = follower_id)
with check (auth.uid() = follower_id);

drop policy if exists "parties_read_all" on public.parties;
drop policy if exists "parties_create_own" on public.parties;
drop policy if exists "parties_update_owner" on public.parties;
create policy "parties_read_all"
on public.parties
for select
to authenticated
using (true);
create policy "parties_create_own"
on public.parties
for insert
to authenticated
with check (auth.uid() = owner_id);
create policy "parties_update_owner"
on public.parties
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "party_members_read_all" on public.party_members;
drop policy if exists "party_members_insert_self" on public.party_members;
drop policy if exists "party_members_delete_self_or_owner" on public.party_members;
create policy "party_members_read_all"
on public.party_members
for select
to authenticated
using (true);
create policy "party_members_insert_self"
on public.party_members
for insert
to authenticated
with check (auth.uid() = user_id);
create policy "party_members_delete_self_or_owner"
on public.party_members
for delete
to authenticated
using (
	auth.uid() = user_id
	or exists (
		select 1 from public.parties p
		where p.id = party_members.party_id
		and p.owner_id = auth.uid()
	)
);
```

The app enforces a max of 6 members per party in client logic. If you want strict server-side enforcement, add a trigger that blocks inserts into `party_members` when a party already has 6 rows.

## Run locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.
