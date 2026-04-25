-- =====================================================
-- BallPark: スタッフ出欠を予定単位から日付単位へ変更
-- =====================================================
-- ※ Supabase SQL Editor にコピペして実行してください

-- 1. スタッフ出欠に日付カラムを追加
alter table staff_attendances add column if not exists attendance_date date;

-- 2. 既存のスタッフ出欠は、紐づく予定の日本時間の日付で初期化
update staff_attendances sa
set attendance_date = (g.date_start at time zone 'Asia/Tokyo')::date
from games g
where sa.game_id = g.id
  and sa.attendance_date is null;

-- 3. 同じ日に複数予定へ同じスタッフが回答済みの場合は、最新の1件だけ残す
with ranked as (
  select
    id,
    row_number() over (
      partition by team_id, attendance_date, staff_name
      order by created_at desc, id desc
    ) as row_num
  from staff_attendances
  where attendance_date is not null
)
delete from staff_attendances
where id in (
  select id from ranked where row_num > 1
);

-- 4. 今後のスタッフ出欠は「チーム + 日付 + スタッフ名」で1件にする
create unique index if not exists idx_staff_attendances_team_date_name
on staff_attendances(team_id, attendance_date, staff_name);

create index if not exists idx_staff_attendances_attendance_date
on staff_attendances(attendance_date);
