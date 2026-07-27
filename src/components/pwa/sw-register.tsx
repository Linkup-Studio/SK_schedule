"use client";

import { useEffect } from "react";

/** Service Workerをアプリ起動時に登録する（プッシュ通知の受け皿） */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.error("Service Workerの登録に失敗しました:", e);
      });
    }
  }, []);

  return null;
}
