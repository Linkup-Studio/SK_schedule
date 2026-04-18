-- =====================================================
-- BallPark マルチテナント化 マイグレーション SQL
-- =====================================================
-- ※ Supabase SQL Editor にコピペして実行してください
-- ※ 既存のSKデータは保持されます（team_id が自動付与されます）

-- =====================================================
-- Step 1: teams テーブルの作成
-- =====================================================
create table teams (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,          -- URLパス用（例: 'sk', 'team-b'）
  name text not null,                 -- チーム正式名（例: '一色SKクラブ'）
  short_name text not null,           -- 短縮名（例: 'SK'）
  passcode text not null,             -- チーム入室用合言葉
  admin_passcode text not null,       -- 管理者パスコード
  theme_color text default 'blue',    -- テーマカラー（将来用）
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SKチームを最初のテナントとして登録
insert into teams (slug, name, short_name, passcode, admin_passcode)
values ('sk', '一色SKクラブ', 'SK', 'sk2026', '1234');

-- =====================================================
-- Step 2: 既存テーブルに team_id カラムを追加
-- =====================================================

-- games テーブル
alter table games add column team_id uuid references teams(id);
update games set team_id = (select id from teams where slug = 'sk');
alter table games alter column team_id set not null;

-- attendances テーブル
alter table attendances add column team_id uuid references teams(id);
update attendances set team_id = (select id from teams where slug = 'sk');
alter table attendances alter column team_id set not null;

-- announcements テーブル
alter table announcements add column team_id uuid references teams(id);
update announcements set team_id = (select id from teams where slug = 'sk');
alter table announcements alter column team_id set not null;

-- players テーブル（存在する場合）
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'players') then
    execute 'alter table players add column team_id uuid references teams(id)';
    execute 'update players set team_id = (select id from teams where slug = ''sk'')';
    execute 'alter table players alter column team_id set not null';
  end if;
end $$;

-- =====================================================
-- Step 3: RLS ポリシー更新
-- =====================================================

-- teams テーブル
alter table teams enable row level security;
create policy "Allow public read teams" on teams for select using (true);

-- 既存ポリシーの削除（エラー回避のため if exists 的に do block で）
do $$
begin
  drop policy if exists "Allow public read games" on games;
  drop policy if exists "Allow public write games" on games;
  drop policy if exists "Allow public read attendances" on attendances;
  drop policy if exists "Allow public insert attendances" on attendances;
  drop policy if exists "Allow public update attendances" on attendances;
  drop policy if exists "Allow public read announcements" on announcements;
  drop policy if exists "Allow public write announcements" on announcements;
end $$;

-- 新ポリシー（変更なし：引き続き公開アクセス。team_id によるフィルタはアプリ側で実施）
create policy "Allow public read games" on games for select using (true);
create policy "Allow public write games" on games for all using (true);
create policy "Allow public read attendances" on attendances for select using (true);
create policy "Allow public insert attendances" on attendances for insert with check (true);
create policy "Allow public update attendances" on attendances for update using (true);
create policy "Allow public read announcements" on announcements for select using (true);
create policy "Allow public write announcements" on announcements for all using (true);

-- =====================================================
-- Step 4: インデックス追加（パフォーマンス）
-- =====================================================
create index idx_games_team_id on games(team_id);
create index idx_attendances_team_id on attendances(team_id);
create index idx_announcements_team_id on announcements(team_id);
create index idx_teams_slug on teams(slug);
