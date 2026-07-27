"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, BellOff, Share, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useTeam } from "@/components/team/team-provider";
import {
  getPushSupport,
  isPermissionDenied,
  isSubscribed,
  subscribePush,
  unsubscribePush,
  sendTestPush,
  type PushSupport,
} from "@/lib/push";

/** 設定ページ内の「プッシュ通知」カード */
export function PushNotificationCard() {
  const { teamSlug } = useTeam();
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    async function init() {
      setSupport(getPushSupport());
      setDenied(isPermissionDenied());
      setSubscribed(await isSubscribed());
    }
    init();
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    const result = await subscribePush(teamSlug);
    setBusy(false);
    if (result.ok) {
      setSubscribed(true);
    } else {
      setDenied(isPermissionDenied());
      alert(`通知をONにできませんでした。\n${result.error ?? ""}`);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    await unsubscribePush();
    setBusy(false);
    setSubscribed(false);
    setTestSent(false);
  };

  const handleTest = async () => {
    setBusy(true);
    const result = await sendTestPush(teamSlug);
    setBusy(false);
    if (result.ok) {
      setTestSent(true);
    } else {
      alert(`テスト通知を送れませんでした。\n${result.error ?? ""}`);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 text-primary font-bold mb-3">
        <Bell className="w-5 h-5" />
        <h2 className="text-[15px]">プッシュ通知</h2>
      </div>

      {support === null && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      )}

      {support === "ios-needs-install" && (
        <div className="space-y-3">
          <p className="text-[12px] text-muted leading-relaxed">
            iPhone・iPadで通知を受け取るには、先にこのアプリをホーム画面に追加してください。
          </p>
          <ol className="text-[12px] text-foreground font-medium leading-relaxed space-y-2 bg-surface-variant/50 rounded-xl px-3.5 py-3 list-none">
            <li className="flex items-start gap-2">
              <span className="font-black text-primary shrink-0">1.</span>
              <span className="flex items-center gap-1 flex-wrap">
                Safari下部の共有ボタン
                <Share className="w-3.5 h-3.5 inline text-primary" />
                をタップ
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-black text-primary shrink-0">2.</span>
              <span>「ホーム画面に追加」を選ぶ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-black text-primary shrink-0">3.</span>
              <span>ホーム画面の「BallPark」を開いて、この画面で通知をONにする</span>
            </li>
          </ol>
        </div>
      )}

      {support === "unsupported" && (
        <p className="text-[12px] text-muted leading-relaxed">
          この端末・ブラウザではプッシュ通知を利用できません。
        </p>
      )}

      {support === "ok" && (
        <div className="space-y-3">
          {subscribed ? (
            <>
              <p className="text-[13px] text-info font-bold bg-info/10 px-3 py-2 rounded-xl border border-info/20 flex gap-2">
                <BellRing className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  通知はONです。お知らせや新しい予定が投稿されると、この端末に通知が届きます。
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleTest}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-primary/10 text-primary text-[13px] font-bold rounded-xl active:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {testSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      送信しました
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      テスト通知を送る
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisable}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-surface-variant text-muted text-[13px] font-bold rounded-xl active:bg-border transition-colors disabled:opacity-50"
                >
                  <BellOff className="w-4 h-4" />
                  通知をOFFにする
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] text-muted leading-relaxed">
                ONにすると、お知らせや新しい予定が投稿されたときにこの端末へ通知が届きます。
              </p>
              {denied && (
                <p className="text-[12px] text-error font-bold leading-relaxed bg-error/5 px-3 py-2 rounded-xl border border-error/20">
                  通知がブロックされています。端末の設定アプリからこのアプリの通知を許可してください。
                </p>
              )}
              <button
                onClick={handleEnable}
                disabled={busy || denied}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold text-[14px] rounded-xl active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
                通知をONにする
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
