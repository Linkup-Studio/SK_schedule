# プッシュ通知 セットアップ手順

> **✅ セットアップ完了済み（2026-07-28）**
> テーブル作成・Edge Functionデプロイ・Secrets設定はすべて実施済み。
> 以下はアーキテクチャの説明と、再セットアップが必要になった場合の手順として残す。
> 補足: 本番の `teams.id` は text型（旧スキーマ）のため `push_subscriptions.team_id` も text。

アプリ側（PWA化・購読UI・送信トリガー）は実装済み。
残りは **Supabase側の3ステップ** だけ。すべてSupabaseダッシュボード上で完結する。

## 仕組み

```
お知らせ投稿 / 予定登録
  └─ createAnnouncement()
       └─ Edge Function「send-push」を呼ぶ（チームの合言葉で認証）
            └─ push_subscriptions の購読者全員にWebプッシュ送信
                 └─ 各端末の Service Worker (public/sw.js) が通知を表示
```

- 通知ONの操作: アプリの「管理設定」ページ →「プッシュ通知」カード
- iPhone/iPad: **ホーム画面に追加**したアプリからのみ通知可能（iOS 16.4以上）。設定カードに案内が出る
- Android/PC Chrome: ブラウザのままでもOK

## Step 1: テーブル作成

Supabase SQL Editor で `supabase-migration-push-subscriptions.sql` を実行する。

## Step 2: Edge Function 作成

1. Supabaseダッシュボード → Edge Functions → 「Deploy a new function」→ エディタで作成
2. 関数名: `send-push`
3. `supabase/functions/send-push/index.ts` の中身を貼り付けてデプロイ

（CLI派なら: `supabase functions deploy send-push`）

## Step 3: Secrets 設定

Edge Functions → Secrets に以下2つを追加する。
値はローカルの `.env.local`（または `~/.ballpark-vapid.txt`）に保管してある。

| Secret名 | 値 |
|---|---|
| `VAPID_PUBLIC_KEY` | `BE8yzKa-Co5YI-dwDBCdglDznRHanxrIRSi7E70f-hBrnTPeLqUAoyjn61PSNks5l5KMmSN1Zbe3EK-V1IltP2s` |
| `VAPID_PRIVATE_KEY` | ※`.env.local` の `VAPID_PRIVATE_KEY` を参照（リポジトリには置かない） |

> 秘密鍵を変えると全端末の購読が無効になるので、この鍵ペアは固定で使い続けること。

## 動作確認

1. スマホで https://www.teamnote.info を開く（iPhoneはホーム画面に追加してから開く）
2. 管理設定 → プッシュ通知 → 「通知をONにする」
3. 「テスト通知を送る」→ 通知が届けば完了
4. 本番確認: お知らせを投稿すると、通知ONの全端末に届く

## トラブルシューティング

- **テスト通知が失敗する** → Step 1〜3 のどれかが未完了。Edge Functions のログを確認
- **iPhoneで通知ONボタンが出ない** → ホーム画面に追加した方のアイコンから開いているか確認
- **通知が来なくなった端末がある** → 購読が期限切れ。設定画面で一度OFF→ONし直す
