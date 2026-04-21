-- =====================================================
-- BallPark スコアブック＆得点板 テーブル定義
-- =====================================================
-- ※ ballpark-test の SQL Editor に貼り付けて Run

-- 1. スコアブック試合記録
create table scorebook_games (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) not null,
  game_id uuid references games(id) on delete cascade not null,
  opponent text not null,
  our_team_name text not null default 'SK',
  inning_scores_us integer[] default '{}',
  inning_scores_them integer[] default '{}',
  total_score_us integer default 0,
  total_score_them integer default 0,
  total_innings integer default 7,
  is_home boolean default true,
  status text default 'setup' check (status in ('setup', 'lineup', 'live', 'completed')),
  current_inning integer default 1,
  current_half text default 'top' check (current_half in ('top', 'bottom')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ラインナップ（打順）
create table scorebook_lineup (
  id uuid primary key default uuid_generate_v4(),
  scorebook_game_id uuid references scorebook_games(id) on delete cascade not null,
  player_name text not null,
  batting_order integer not null,
  position integer check (position between 1 and 9),
  is_starter boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 打席結果
create table scorebook_at_bats (
  id uuid primary key default uuid_generate_v4(),
  scorebook_game_id uuid references scorebook_games(id) on delete cascade not null,
  player_name text not null,
  inning integer not null,
  result text not null,
  rbi integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS設定
alter table scorebook_games enable row level security;
alter table scorebook_lineup enable row level security;
alter table scorebook_at_bats enable row level security;

create policy "Allow public read scorebook_games" on scorebook_games for select using (true);
create policy "Allow public write scorebook_games" on scorebook_games for all using (true);
create policy "Allow public read scorebook_lineup" on scorebook_lineup for select using (true);
create policy "Allow public write scorebook_lineup" on scorebook_lineup for all using (true);
create policy "Allow public read scorebook_at_bats" on scorebook_at_bats for select using (true);
create policy "Allow public write scorebook_at_bats" on scorebook_at_bats for all using (true);

-- インデックス
create index idx_scorebook_games_game_id on scorebook_games(game_id);
create index idx_scorebook_games_team_id on scorebook_games(team_id);
create index idx_scorebook_lineup_game_id on scorebook_lineup(scorebook_game_id);
create index idx_scorebook_at_bats_game_id on scorebook_at_bats(scorebook_game_id);
