-- =====================================================
-- BallPark: スタッフ出欠 一括セットアップ（冪等・再実行OK）
-- =====================================================
-- ※ Supabase の「SQL Editor」にこの全文を貼り付けて Run してください。
-- ※ staff_attendances テーブルが無い／列が足りない環境を一発で整えます。
-- ※ 既存データは保持されます（add column if not exists / create if not exists）。

-- 0. スタッフPIN（teams 側）
alter table teams add column if not exists staff_pin text;

-- 1. テーブル本体（無ければ作成）
create table if not exists staff_attendances (
  id uuid primary key default uuid_generate_v4(),
  team_id text not null,
  game_id uuid references games(id) on delete cascade not null,
  attendance_date date,
  staff_name text not null,
  status text not null check (status in ('attend', 'absent', 'undecided')),
  morning_status text,
  afternoon_status text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 既に部分的に存在する場合に備えて不足カラムを補完
alter table staff_attendances add column if not exists attendance_date date;
alter table staff_attendances add column if not exists morning_status text;
alter table staff_attendances add column if not exists afternoon_status text;
alter table staff_attendances add column if not exists note text;

-- 3. 午前/午後の値を status で初期化（未設定分のみ）
update staff_attendances
set
  morning_status = coalesce(morning_status, status),
  afternoon_status = coalesce(afternoon_status, status)
where morning_status is null or afternoon_status is null;

-- 4. 値チェック制約（無ければ追加）
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'staff_attendances_morning_status_check') then
    alter table staff_attendances
      add constraint staff_attendances_morning_status_check
      check (morning_status in ('attend', 'absent', 'undecided')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'staff_attendances_afternoon_status_check') then
    alter table staff_attendances
      add constraint staff_attendances_afternoon_status_check
      check (afternoon_status in ('attend', 'absent', 'undecided')) not valid;
  end if;
end $$;

-- 5. 同一(チーム+日付+スタッフ名)の重複を1件に整理してから一意インデックス作成
--    （upsert の onConflict: team_id,attendance_date,staff_name に必須）
with ranked as (
  select id,
         row_number() over (
           partition by team_id, attendance_date, staff_name
           order by created_at desc, id desc
         ) as rn
  from staff_attendances
  where attendance_date is not null
)
delete from staff_attendances
where id in (select id from ranked where rn > 1);

create unique index if not exists idx_staff_attendances_team_date_name
  on staff_attendances(team_id, attendance_date, staff_name);

create index if not exists idx_staff_attendances_team_id on staff_attendances(team_id);
create index if not exists idx_staff_attendances_game_id on staff_attendances(game_id);
create index if not exists idx_staff_attendances_attendance_date on staff_attendances(attendance_date);

-- 6. RLS（他テーブルと同じ公開アクセスに揃える。PINでUI制御する現行方式）
alter table staff_attendances enable row level security;
drop policy if exists "Allow public read staff attendances" on staff_attendances;
drop policy if exists "Allow public insert staff attendances" on staff_attendances;
drop policy if exists "Allow public update staff attendances" on staff_attendances;
drop policy if exists "Allow public delete staff attendances" on staff_attendances;
create policy "Allow public read staff attendances"   on staff_attendances for select using (true);
create policy "Allow public insert staff attendances"  on staff_attendances for insert with check (true);
create policy "Allow public update staff attendances"  on staff_attendances for update using (true);
create policy "Allow public delete staff attendances"  on staff_attendances for delete using (true);

-- 7. スタッフPINの設定（必要に応じてコメントを外して値を入れて実行）
-- update teams set staff_pin = 'ここにスタッフPIN' where slug = 'sk';
