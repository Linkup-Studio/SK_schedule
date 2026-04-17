-- ============================================================
-- BallPark マルチテナント化マイグレーション
--
-- 【重要】このSQLは既存データを壊しません。
-- 既存の games / attendances / announcements / players は
-- すべて一色SKクラブ（team_id = 'sk'）に自動紐付けされます。
--
-- 実行場所: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. teams テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  theme_color   TEXT NOT NULL DEFAULT '#1a237e',
  theme_color_light TEXT NOT NULL DEFAULT '#3949ab',
  description   TEXT,
  passphrase    TEXT NOT NULL,
  admin_pin     TEXT NOT NULL DEFAULT '1234',
  logo_url      TEXT,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. 一色SKクラブを登録（既存チーム）
-- ============================================================
INSERT INTO teams (id, name, slug, theme_color, theme_color_light, description, passphrase, admin_pin)
VALUES (
  'sk',
  '一色SKクラブ',
  'issiki-sk',
  '#1a237e',
  '#3949ab',
  '愛知県西尾市一色町の中学野球クラブチーム',
  'sk2026',
  '1234'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. 既存テーブルに team_id カラム追加
--    DEFAULT 'sk' により既存データは全て一色SKに紐付け
-- ============================================================

-- games
ALTER TABLE games ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'sk' REFERENCES teams(id);
UPDATE games SET team_id = 'sk' WHERE team_id IS NULL;

-- attendances
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'sk' REFERENCES teams(id);
UPDATE attendances SET team_id = 'sk' WHERE team_id IS NULL;

-- announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'sk' REFERENCES teams(id);
UPDATE announcements SET team_id = 'sk' WHERE team_id IS NULL;

-- players
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'sk' REFERENCES teams(id);
UPDATE players SET team_id = 'sk' WHERE team_id IS NULL;

-- ============================================================
-- 4. インデックス追加（team_id での検索高速化）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_games_team_id ON games (team_id);
CREATE INDEX IF NOT EXISTS idx_attendances_team_id ON attendances (team_id);
CREATE INDEX IF NOT EXISTS idx_announcements_team_id ON announcements (team_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id);

-- ============================================================
-- 5. テスト用: 2つ目のチーム追加（港スターズ）
-- ============================================================
INSERT INTO teams (id, name, slug, theme_color, theme_color_light, description, passphrase, admin_pin)
VALUES (
  'minato-stars',
  '港スターズ',
  'minato-stars',
  '#b71c1c',
  '#e53935',
  '名古屋市港区の中学野球クラブチーム',
  'stars2026',
  '5678'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 確認クエリ（実行後にこれで確認）
-- ============================================================
-- SELECT * FROM teams;
-- SELECT team_id, count(*) FROM games GROUP BY team_id;
-- SELECT team_id, count(*) FROM attendances GROUP BY team_id;
-- SELECT team_id, count(*) FROM announcements GROUP BY team_id;
