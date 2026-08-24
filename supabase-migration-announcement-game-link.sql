-- お知らせ→予定ジャンプ（2026-08-24）
-- 予定登録の自動お知らせに、元の予定(games)へのリンクを持たせる。
-- 既存行はNULLのまま（リンクなしとして従来どおり表示される）。
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES games(id) ON DELETE SET NULL;
