-- =====================================================
-- BallPark: スタッフ出欠機能 追加マイグレーション
-- =====================================================
-- ※ Supabase SQL Editor にコピペして実行してください
-- ※ staff_pin の実値は実行後に Supabase 側で設定してください

-- 1. チームごとのスタッフPIN
alter table teams add column if not exists staff_pin text;

-- 2. スタッフ出欠テーブル
create table if not exists staff_attendances (
  id uuid primary key default uuid_generate_v4(),
  team_id text not null,
  game_id uuid references games(id) on delete cascade not null,
  staff_name text not null,
  status text not null check (status in ('attend', 'absent', 'undecided')),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(game_id, staff_name)
);

-- 3. RLS
alter table staff_attendances enable row level security;

drop policy if exists "Allow public read staff attendances" on staff_attendances;
drop policy if exists "Allow public insert staff attendances" on staff_attendances;
drop policy if exists "Allow public update staff attendances" on staff_attendances;
drop policy if exists "Allow public delete staff attendances" on staff_attendances;

-- 現行アプリはPINでUI制御する方式のため、DBポリシーは既存テーブルと同じ公開アクセスに揃えます。
-- 本番強化時は Supabase Auth + RLS に移行してください。
create policy "Allow public read staff attendances" on staff_attendances for select using (true);
create policy "Allow public insert staff attendances" on staff_attendances for insert with check (true);
create policy "Allow public update staff attendances" on staff_attendances for update using (true);
create policy "Allow public delete staff attendances" on staff_attendances for delete using (true);

-- 4. インデックス
create index if not exists idx_staff_attendances_team_id on staff_attendances(team_id);
create index if not exists idx_staff_attendances_game_id on staff_attendances(game_id);

-- 5. SKチームのスタッフPIN設定例
-- update teams set staff_pin = 'ここにスタッフPIN' where id = 'sk';
