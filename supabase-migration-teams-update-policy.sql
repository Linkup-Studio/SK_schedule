-- =====================================================
-- BallPark: teams テーブルに UPDATE ポリシーを追加
-- =====================================================
-- 問題: teams テーブルに SELECT ポリシーしかなく、
--       player_counts の更新が RLS にブロックされていた
--
-- ※ Supabase SQL Editor にコピペして実行してください

create policy "Allow public update teams" on teams for update using (true);
