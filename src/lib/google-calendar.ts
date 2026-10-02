/**
 * スタッフ出欠 → 自分のGoogleカレンダーに直接書き込む（Google Calendar API・10/2 ひろさん）
 * - アプリは静的書き出し（サーバーなし）なので、Googleのログイン画面へ移動し、戻ってきた /gcal-callback/ でブラウザから書き込む
 * - 書き込む予定の中身は state に入れて往復させる（端末に何も残さない・iPhoneのホーム画面アプリでも動く）
 * - 権限は「予定の追加・変更」だけ（calendar.events）。カレンダーの中身を読むことはしない
 */
export const GOOGLE_CLIENT_ID = "";
export const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export interface GcalEvent {
  summary: string;
  location: string;
  description: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  back: string; // 追加し終わったら戻る画面
}

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromB64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

export function gcalRedirectUri(): string {
  return `${window.location.origin}/gcal-callback/`;
}

export function gcalAuthUrl(ev: GcalEvent): string | null {
  if (!GOOGLE_CLIENT_ID) return null;
  const p = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: gcalRedirectUri(),
    response_type: "token",
    scope: GCAL_SCOPE,
    include_granted_scopes: "true",
    prompt: "select_account",
    state: b64url(JSON.stringify(ev)),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export async function insertEvent(token: string, ev: GcalEvent): Promise<{ ok: true; link: string } | { ok: false; message: string }> {
  const body = {
    summary: ev.summary,
    location: ev.location || undefined,
    description: ev.description || undefined,
    start: { dateTime: `${ev.date}T${ev.start}:00`, timeZone: "Asia/Tokyo" },
    end: { dateTime: `${ev.date}T${ev.end}:00`, timeZone: "Asia/Tokyo" },
  };
  const r = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.ok) {
    const j = (await r.json()) as { htmlLink?: string };
    return { ok: true, link: j.htmlLink ?? "" };
  }
  return { ok: false, message: `${r.status}` };
}
