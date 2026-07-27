// =====================================================
// BallPark プッシュ通知送信 Edge Function（send-push）
// =====================================================
// チームの購読者全員（またはテスト用に1端末）へWebプッシュを送る。
// 必要なSecrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// （SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は自動で注入される）

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendPushRequest {
  teamSlug: string;
  passcode: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  testEndpoint?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (status: number, data: Record<string, unknown>) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const payload = (await req.json()) as SendPushRequest;
    const { teamSlug, passcode, title, body, url, tag, testEndpoint } = payload;

    if (!teamSlug || !title || !body) {
      return json(400, { error: "teamSlug, title, body は必須です" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // チーム解決（新スキーマ: slug列 / 旧スキーマ: id=スラッグ）
    const bySlug = await supabase
      .from("teams")
      .select("*")
      .eq("slug", teamSlug)
      .maybeSingle();
    const { data: team } = bySlug.data
      ? bySlug
      : await supabase.from("teams").select("*").eq("id", teamSlug).maybeSingle();

    if (!team) {
      return json(404, { error: "チームが見つかりません" });
    }

    // 合言葉チェック（チーム入室に使うものと同じ）
    const teamPasscode = team.passphrase ?? team.passcode ?? "";
    if (!teamPasscode || passcode !== teamPasscode) {
      return json(403, { error: "合言葉が一致しません" });
    }

    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("team_id", team.id);
    if (testEndpoint) {
      query = query.eq("endpoint", testEndpoint);
    }
    const { data: subs, error: subsError } = await query;
    if (subsError) {
      return json(500, { error: subsError.message });
    }
    if (!subs || subs.length === 0) {
      return json(200, { sent: 0, failed: 0, message: "購読者がいません" });
    }

    webpush.setVapidDetails(
      "mailto:srs.hironori1422@gmail.com",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!
    );

    const message = JSON.stringify({ title, body, url: url ?? "/", tag });

    const results = await Promise.allSettled(
      (subs as SubscriptionRow[]).map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message
        )
      )
    );

    // 期限切れ・解除済みの購読（404/410）はDBから掃除する
    const goneIds: string[] = [];
    let sent = 0;
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        sent++;
        return;
      }
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        goneIds.push((subs as SubscriptionRow[])[i].id);
      }
    });
    if (goneIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", goneIds);
    }

    return json(200, {
      sent,
      failed: results.length - sent,
      cleaned: goneIds.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json(500, { error: message });
  }
});
