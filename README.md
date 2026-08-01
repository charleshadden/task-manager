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

-- Leaderboard RPC (rank all users by XP from latest state)
drop function if exists public.get_xp_leaderboard(int);

create or replace function public.get_xp_leaderboard(row_limit int default 50)
returns table (
	rank bigint,
	user_id uuid,
	display_name text,
	photo_url text,
	xp integer
)
language sql
security definer
set search_path = public
as $$
	with latest as (
		select
			(hs.device_id)::uuid as user_id,
			hs.state,
			hs.updated_at
		from public.habit_states hs
		where hs.device_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
	),
	scored as (
		select
			l.user_id,
			coalesce(nullif(p.display_name, ''), split_part(au.email, '@', 1), 'Unknown Adventurer') as display_name,
			coalesce(p.photo_url, '') as photo_url,
			greatest(coalesce((l.state ->> 'xp')::int, 0), 0) as xp
		from latest l
		left join public.profiles p on p.user_id = l.user_id
		left join auth.users au on au.id = l.user_id
	)
	select
		row_number() over (order by s.xp desc, s.display_name asc, s.user_id asc) as rank,
		s.user_id,
		s.display_name,
		s.photo_url,
		s.xp
	from scored s
	order by rank asc
	limit greatest(1, least(coalesce(row_limit, 50), 200));
$$;

grant execute on function public.get_xp_leaderboard(int) to authenticated;

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

## Profile photo upload setup

To allow real image uploads (instead of URL-only), create a public Storage bucket and add bucket policies:

```sql
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "profile_photos_public_read" on storage.objects;
drop policy if exists "profile_photos_upload_own" on storage.objects;
drop policy if exists "profile_photos_update_own" on storage.objects;
drop policy if exists "profile_photos_delete_own" on storage.objects;

create policy "profile_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'profile-photos');

create policy "profile_photos_upload_own"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'profile-photos'
	and split_part(name, '/', 1) = auth.uid()::text
);

create policy "profile_photos_update_own"
on storage.objects
for update
to authenticated
using (
	bucket_id = 'profile-photos'
	and split_part(name, '/', 1) = auth.uid()::text
)
with check (
	bucket_id = 'profile-photos'
	and split_part(name, '/', 1) = auth.uid()::text
);

create policy "profile_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'profile-photos'
	and split_part(name, '/', 1) = auth.uid()::text
);
```

This lets every signed-in user upload only to their own folder path (their auth user id), while keeping profile images publicly readable for avatars.

## Run locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## FatSecret integration (secure setup)

Do not put FatSecret credentials in frontend files. The client secret must only live on a trusted backend.

The app now calls a backend endpoint at:

- `/api/fatsecret/search?query=<term>&limit=<n>`

Expected JSON response shape:

```json
{
	"items": [
		{
			"name": "Chicken Breast, grilled",
			"calories": 165,
			"protein": 31,
			"carbs": 0,
			"fat": 4
		}
	]
}
```

Backend requirements:

1. Keep `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET` in server environment variables only.
2. Exchange credentials for a FatSecret access token server-side.
3. Query FatSecret food search and normalize results into the JSON format above.
4. Never return secrets to the browser.

If your credentials were shared in chat or committed anywhere, rotate them immediately in FatSecret developer settings.

### Vercel environment variables

If deploying on Vercel, add these project env vars:

1. `FATSECRET_CLIENT_ID`
2. `FATSECRET_CLIENT_SECRET`

The route also accepts your current names:

1. `Client_ID`
2. `Client_Secret`

This repo includes a server route at [api/fatsecret/search.js](api/fatsecret/search.js) that reads those env vars and proxies requests safely.
