-- =====================================================
-- BallPark プッシュ通知 マイグレーション SQL
-- =====================================================
-- ※ Supabase SQL Editor にコピペして実行してください
-- ※ 各端末のプッシュ購読情報を保存するテーブルを作成します

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  endpoint text not null unique,      -- プッシュ配信先URL（端末×ブラウザごとに一意）
  p256dh text not null,               -- 暗号化用の公開鍵
  auth text not null,                 -- 認証シークレット
  member_name text,                   -- 出欠で使っている名前（任意・誰の端末かの目安）
  user_agent text,                    -- 端末情報（デバッグ用）
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_push_subscriptions_team on push_subscriptions (team_id);

-- RLS（既存テーブルと同じく公開ポリシー方式）
alter table push_subscriptions enable row level security;

drop policy if exists "Allow public read push_subscriptions" on push_subscriptions;
drop policy if exists "Allow public insert push_subscriptions" on push_subscriptions;
drop policy if exists "Allow public update push_subscriptions" on push_subscriptions;
drop policy if exists "Allow public delete push_subscriptions" on push_subscriptions;

create policy "Allow public read push_subscriptions" on push_subscriptions for select using (true);
create policy "Allow public insert push_subscriptions" on push_subscriptions for insert with check (true);
create policy "Allow public update push_subscriptions" on push_subscriptions for update using (true);
create policy "Allow public delete push_subscriptions" on push_subscriptions for delete using (true);
