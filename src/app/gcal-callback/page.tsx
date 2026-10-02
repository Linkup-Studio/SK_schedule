"use client";

import { useEffect, useState } from "react";
import { fromB64url, insertEvent, type GcalEvent } from "@/lib/google-calendar";

type State =
  | { kind: "working" }
  | { kind: "done"; ev: GcalEvent; link: string }
  | { kind: "error"; message: string; back?: string };

/** Googleのログインから戻ってきた所。予定を自分のGoogleカレンダーに書き込んで、結果を出す */
export default function GcalCallbackPage() {
  // ログインから戻ってきたURL（#以降）を読む。読み終わったらURLから鍵を消す
  const [parsed] = useState<{ token: string | null; ev: GcalEvent | null; error: string | null }>(() => {
    if (typeof window === "undefined") return { token: null, ev: null, error: null };
    const h = new URLSearchParams(window.location.hash.slice(1));
    history.replaceState(null, "", window.location.pathname);
    let ev: GcalEvent | null = null;
    try {
      ev = JSON.parse(fromB64url(h.get("state") ?? "")) as GcalEvent;
    } catch {
      ev = null;
    }
    return { token: h.get("access_token"), ev, error: h.get("error") };
  });
  const [st, setSt] = useState<State>(() => {
    const { token, ev, error } = parsed;
    if (error) return { kind: "error", message: error === "access_denied" ? "Googleでの許可がキャンセルされました。" : `Googleのログインでエラーが出ました（${error}）。`, back: ev?.back };
    if (typeof window !== "undefined" && (!token || !ev)) return { kind: "error", message: "予定の情報を受け取れませんでした。もう一度、出欠の画面からボタンを押してください。", back: ev?.back };
    return { kind: "working" };
  });

  useEffect(() => {
    const { token, ev, error } = parsed;
    if (error || !token || !ev) return;
    insertEvent(token, ev).then((r) =>
      setSt(r.ok ? { kind: "done", ev, link: r.link } : { kind: "error", message: `Googleカレンダーに追加できませんでした（${r.message}）。もう一度お試しください。`, back: ev.back })
    );
  }, [parsed]);

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-6 text-center shadow-sm space-y-4">
        {st.kind === "working" && <p className="font-bold text-muted">Googleカレンダーに追加しています…</p>}
        {st.kind === "done" && (
          <>
            <p className="text-3xl">✅</p>
            <p className="text-lg font-black text-attend">Googleカレンダーに追加しました</p>
            <p className="text-[14px] font-bold">{st.ev.date.replace(/-/g, "/")} {st.ev.start}〜{st.ev.end}</p>
            <p className="text-[13px] text-muted">{st.ev.summary}</p>
            {st.link && (
              <a href={st.link} target="_blank" rel="noopener noreferrer" className="block text-[13px] font-bold text-info underline">Googleカレンダーで見る</a>
            )}
            <a href={st.ev.back} className="block w-full rounded-xl bg-info py-3 text-[15px] font-black text-white">アプリに戻る</a>
          </>
        )}
        {st.kind === "error" && (
          <>
            <p className="text-3xl">⚠️</p>
            <p className="font-bold text-error">{st.message}</p>
            {st.back && <a href={st.back} className="block w-full rounded-xl bg-info py-3 text-[15px] font-black text-white">出欠の画面に戻る</a>}
          </>
        )}
      </div>
    </main>
  );
}
