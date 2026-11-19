-- Reference catalog: the UI catalog lives in src/lib/games.ts; ids must match.
create table public.games (
  id text primary key,
  title text not null,
  accepts_scores boolean not null default false,
  created_at timestamptz not null default now(),
  constraint games_id_format check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

insert into public.games (id, title, accepts_scores) values
  ('brick-buster', 'BRICK BUSTER', false),
  ('block-fall', 'BLOCK FALL', false),
  ('serpentine', 'SERPENTINE', false),
  ('glutton', 'GLUTTON', false),
  ('invaders', 'INVADERS', false),
  ('rocks', 'ROCKS', false),
  ('frog-crossing', 'FROG CROSSING', false),
  ('pixel-duel', 'PIXEL DUEL', false),
  ('asteroids', 'ASTEROIDS', true);

create table public.scores (
  id bigint generated always as identity primary key,
  game_id text not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null,
  created_at timestamptz not null default now(),
  constraint scores_score_range check (score between 1 and 9999999)
);

-- Ranking reads: best scores of a game, earliest first on ties.
create index scores_game_score_idx
  on public.scores (game_id, score desc, created_at);
create index scores_user_id_idx on public.scores (user_id);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games are readable by everyone"
  on public.games for select using (true);

create policy "scores are readable by everyone"
  on public.scores for select using (true);

create policy "users insert their own scores in scoring games"
  on public.scores for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.games
      where games.id = scores.game_id and games.accepts_scores
    )
  );

-- One row per player and game: their best score (earliest one on ties), ranked.
create view public.game_leaderboard
with (security_invoker = true) as
select
  best.game_id,
  best.user_id,
  profiles.username,
  best.score,
  best.created_at as achieved_at,
  row_number() over (
    partition by best.game_id
    order by best.score desc, best.created_at
  ) as rank
from (
  select distinct on (game_id, user_id) game_id, user_id, score, created_at
  from public.scores
  order by game_id, user_id, score desc, created_at
) as best
join public.profiles on profiles.id = best.user_id;

-- Every game appears, with 0 / null when it has no scores yet.
create view public.game_stats
with (security_invoker = true) as
select
  games.id as game_id,
  max(scores.score) as best_score,
  count(scores.id) as score_count
from public.games
left join public.scores on scores.game_id = games.id
group by games.id;

-- Grant only what the policies allow (same pattern as profiles).
revoke all on public.games, public.scores, public.game_leaderboard, public.game_stats
  from anon, authenticated;
grant select on public.games, public.scores, public.game_leaderboard, public.game_stats
  to anon, authenticated;
grant insert (game_id, user_id, score) on public.scores to authenticated;
