create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

-- Unique without regard to case: "Neon_Fox" and "neon_fox" collide.
create unique index profiles_username_lower_key
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- New public tables are not exposed to the Data API by default: grant only what the policies allow.
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

-- Creates the profile when a user signs up (security definer, fixed search_path).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

-- The function only needs to run as a trigger; it must not be callable through the Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
