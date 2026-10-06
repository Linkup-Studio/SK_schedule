/**
 * BallPark Service Worker
 * プッシュ通知の受信・クリック処理のみを担当する（オフラインキャッシュはしない）
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "BallPark",
    body: "新しいお知らせがあります",
    url: "/",
    tag: undefined,
  };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    Promise.all([bumpBadge(payload.badge), self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url },
    })])
  );
});

// 2026-10-07: ホーム画面のアイコンの赤い数字。届くたびに＋1（送る側が数を付けてきたらその数）。
// アプリを開くと navigation.tsx が「まだ見ていない予定＋連絡」の正しい数に合わせ直す
async function bumpBadge(n) {
  try {
    const c = await caches.open("ballpark-badge");
    const r = await c.match("/__badge");
    const cur = r ? Number(await r.text()) || 0 : 0;
    const next = typeof n === "number" ? n : cur + 1;
    await c.put("/__badge", new Response(String(next)));
    if (self.navigator && self.navigator.setAppBadge) {
      if (next > 0) await self.navigator.setAppBadge(next);
      else if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
    }
  } catch (e) {}
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // 既にアプリを開いているタブがあればそちらを前面に
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
