-- =====================================================
-- BallPark: teamsテーブルに player_counts カラムを追加
-- =====================================================
-- ※ Supabase SQL Editor にコピペして実行してください

-- teams テーブルに player_counts（JSONB）を追加
-- 格納例: {"1": 5, "2": 8, "3": 4}（学年ごとの選手人数）
alter table teams add column if not exists player_counts jsonb default '{}'::jsonb;
