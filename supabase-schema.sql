-- BallPark 超シンプル版 データベース定義 (Supabase SQL Editor用)
-- =======================================================
-- ※ Supabaseの「SQL Editor」に以下の全コードをコピペして「Run」を押してください。

-- 1. games テーブル (試合・練習の予定)
create table games (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- 'official' | 'practice' | 'tournament' | 'other'
  title text not null,
  opponent text,
  grades integer[] not null, -- 対象学年。例: [1,2,3]
  venue_name text not null,
  venue_address text,
  meeting_place text,
  date_start timestamp with time zone not null,
  date_end timestamp with time zone,
  meeting_time character varying, -- 例: '08:30'
  rsvp_deadline timestamp with time zone,
  items text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. attendances テーブル (出欠回答)
-- 今回の特長: ユーザーIDではなく「打たれた名前(player_name)」で管理します
create table attendances (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references games(id) on delete cascade not null,
  player_name text not null, -- ユーザーが直接入力した名前
  status text not null check (status in ('attend', 'absent', 'undecided')),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- 1つの試合に対して、同じ名前で何度も登録されないようにする制約
  unique(game_id, player_name)
);

-- 3. announcements テーブル (お知らせ)
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  target_grades integer[] not null,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =======================================================
-- セキュリティ設定 (RLS)
-- これにより「誰でも・ログインなしで」予定を見れて、出欠を送れるようになります。

alter table games enable row level security;
alter table attendances enable row level security;
alter table announcements enable row level security;

-- 誰でも予定の「閲覧」が可能
create policy "Allow public read games" on games for select using (true);
create policy "Allow public read announcements" on announcements for select using (true);

-- 出欠情報は誰でも「閲覧」と「登録（追加・更新）」が可能
create policy "Allow public read attendances" on attendances for select using (true);
create policy "Allow public insert attendances" on attendances for insert with check (true);
create policy "Allow public update attendances" on attendances for update using (true);

-- ※本来、試合の「追加・編集」は管理者(Authenticated)だけにするべきですが、
-- 今回はテストとしてまずは操作できるようにしておきます（後ほど厳格化できます）。
create policy "Allow public write games" on games for all using (true);
create policy "Allow public write announcements" on announcements for all using (true);
