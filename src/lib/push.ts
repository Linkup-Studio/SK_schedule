/**
 * Webプッシュ通知（PWA）
 * - 購読の登録/解除（push_subscriptions テーブルに保存）
 * - 送信は Supabase Edge Function「send-push」経由
 */
import { supabase } from "./supabase";
import { getMyName } from "./my-name";

/** VAPID公開鍵（秘密鍵はSupabase側のSecretsのみに保管） */
const VAPID_PUBLIC_KEY =
  "BE8yzKa-Co5YI-dwDBCdglDznRHanxrIRSi7E70f-hBrnTPeLqUAoyjn61PSNks5l5KMmSN1Zbe3EK-V1IltP2s";

export type PushSupport =
  | "ok"
  | "ios-needs-install" // iOSでホーム画面に追加されていない
  | "unsupported";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

/** この端末・ブラウザでプッシュ通知が使えるか判定する */
export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const hasApi =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  if (hasApi) return "ok";
  // iOSはホーム画面に追加するまでPush APIが現れない
  if (isIOS() && !isStandalone()) return "ios-needs-install";
  return "unsupported";
}

export function isPermissionDenied(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "denied"
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

interface TeamAuthInfo {
  id: string;
  passcode: string;
}

/**
 * チームID・合言葉を取得する。
 * TeamProviderがlocalStorageにキャッシュしているものを優先し、無ければ直接引く
 */
async function resolveTeamAuth(teamSlug: string): Promise<TeamAuthInfo | null> {
  try {
    const cached = localStorage.getItem(`team_cache_${teamSlug}`);
    if (cached) {
      const t = JSON.parse(cached) as { id?: string; passcode?: string };
      if (t.id) return { id: t.id, passcode: t.passcode ?? "" };
    }
  } catch {
    // キャッシュ破損時はDBから引き直す
  }

  const bySlug = await supabase
    .from("teams")
    .select("*")
    .eq("slug", teamSlug)
    .maybeSingle();
  const { data } = bySlug.data
    ? bySlug
    : await supabase.from("teams").select("*").eq("id", teamSlug).maybeSingle();
  if (!data) return null;
  const row = data as {
    id: string;
    passcode?: string | null;
    passphrase?: string | null;
  };
  return { id: row.id, passcode: row.passphrase ?? row.passcode ?? "" };
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/** 現在この端末で購読中か */
export async function isSubscribed(): Promise<boolean> {
  if (getPushSupport() !== "ok") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return Boolean(sub);
  } catch {
    return false;
  }
}

export interface PushResult {
  ok: boolean;
  error?: string;
}

/** プッシュ通知をONにする（許可→購読→Supabaseに保存） */
export async function subscribePush(teamSlug: string): Promise<PushResult> {
  if (getPushSupport() !== "ok") {
    return { ok: false, error: "この端末ではプッシュ通知を利用できません" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "通知が許可されませんでした" };
  }

  const team = await resolveTeamAuth(teamSlug);
  if (!team) {
    return { ok: false, error: "チーム情報の取得に失敗しました" };
  }

  try {
    const reg = await getRegistration();
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, error: "購読情報の取得に失敗しました" };
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        team_id: team.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        member_name: getMyName(teamSlug) || null,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("購読の保存に失敗しました:", error.message);
      return {
        ok: false,
        error: "サーバーへの登録に失敗しました。時間をおいてお試しください",
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("プッシュ購読に失敗しました:", e);
    return { ok: false, error: "購読処理に失敗しました" };
  }
}

/** プッシュ通知をOFFにする（購読解除→Supabaseから削除） */
export async function unsubscribePush(): Promise<PushResult> {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    return { ok: true };
  } catch (e) {
    console.error("購読解除に失敗しました:", e);
    return { ok: false, error: "解除に失敗しました" };
  }
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * チームの購読者全員にプッシュ通知を送る（Edge Function経由）。
 * 失敗してもアプリの動作は止めない（呼び出し側でawait不要）
 */
export async function sendPushToTeam(
  teamSlug: string,
  message: PushMessage
): Promise<void> {
  try {
    const team = await resolveTeamAuth(teamSlug);
    if (!team) return;
    const { error } = await supabase.functions.invoke("send-push", {
      body: {
        teamSlug,
        passcode: team.passcode,
        title: message.title,
        body: message.body,
        url: message.url ?? `/${teamSlug}/announcements/`,
        tag: message.tag,
      },
    });
    if (error) console.error("プッシュ送信に失敗しました:", error);
  } catch (e) {
    // 通知は補助機能なので、失敗しても投稿処理は成功扱いのまま
    console.error("プッシュ送信に失敗しました:", e);
  }
}

/** 自分の端末にだけテスト通知を送る */
export async function sendTestPush(teamSlug: string): Promise<PushResult> {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return { ok: false, error: "先に通知をONにしてください" };
    const team = await resolveTeamAuth(teamSlug);
    if (!team) return { ok: false, error: "チーム情報の取得に失敗しました" };

    const { error } = await supabase.functions.invoke("send-push", {
      body: {
        teamSlug,
        passcode: team.passcode,
        title: "テスト通知",
        body: "プッシュ通知の設定が完了しました 🎉",
        url: `/${teamSlug}/dashboard/`,
        testEndpoint: sub.endpoint,
      },
    });
    if (error) {
      console.error("テスト通知に失敗しました:", error);
      return { ok: false, error: "送信に失敗しました（サーバー未設定の可能性）" };
    }
    return { ok: true };
  } catch (e) {
    console.error("テスト通知に失敗しました:", e);
    return { ok: false, error: "送信に失敗しました" };
  }
}
