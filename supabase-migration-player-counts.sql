-- =====================================================
-- player_counts カラム追加マイグレーション
-- =====================================================
-- teams テーブルに player_counts (JSONB) を追加
-- 例: {"1": 5, "2": 4, "3": 5}
-- これにより全端末で未回答人数が正しく表示される

alter table teams add column player_counts jsonb default '{}'::jsonb;
