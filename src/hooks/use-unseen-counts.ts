"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTeam } from "@/components/team/team-provider";
import { fetchGames, fetchAnnouncements } from "@/lib/supabase-data";

type Kind = "calendar" | "announcements";

function seenKey(teamSlug: string, kind: Kind) {
  return `${teamSlug}_${kind}_seen`;
}

/**
 * 端末ごとの「最後に見た日時」を取得。
 * 初回（未保存）は「今」を既読扱いにして、既存の予定/お知らせで
 * バッジが大量に出るのを防ぐ。
 */
function getSeenAt(teamSlug: string, kind: Kind): number {
  if (typeof window === "undefined") return Date.now();
  const v = localStorage.getItem(seenKey(teamSlug, kind));
  if (!v) {
    localStorage.setItem(seenKey(teamSlug, kind), new Date().toISOString());
    return Date.now();
  }
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

/** 該当ページを見たので既読にする（localStorageのみ更新） */
function markSeen(teamSlug: string, kind: Kind) {
  if (typeof window === "undefined") return;
  localStorage.setItem(seenKey(teamSlug, kind), new Date().toISOString());
}

/**
 * 「予定」「連絡（お知らせ）」の未読件数を返す。
 * - 該当ページ（/calendar, /announcements）を開くと既読化されバッジが消える
 * - 画面遷移ごと、または他箇所の更新（storageイベント）で件数を再計算
 */
export function useUnseenCounts() {
  const { teamSlug } = useTeam();
  const pathname = usePathname();
  const [newGames, setNewGames] = useState(0);
  const [newAnns, setNewAnns] = useState(0);

  // 開いているページを先に既読化（localStorage更新のみ・setStateしない）
  useEffect(() => {
    if (!teamSlug) return;
    const prefix = `/${teamSlug}`;
    if (pathname.startsWith(`${prefix}/calendar`)) markSeen(teamSlug, "calendar");
    if (pathname.startsWith(`${prefix}/announcements`)) markSeen(teamSlug, "announcements");
  }, [pathname, teamSlug]);

  // 件数を再計算（fetch後＝await後にsetStateするので同期setStateにならない）
  useEffect(() => {
    if (!teamSlug) return;
    let cancelled = false;

    async function recount() {
      const [games, anns] = await Promise.all([
        fetchGames(teamSlug),
        fetchAnnouncements(teamSlug),
      ]);
      if (cancelled) return;
      const gSeen = getSeenAt(teamSlug, "calendar");
      const aSeen = getSeenAt(teamSlug, "announcements");
      setNewGames(games.filter((g) => new Date(g.createdAt).getTime() > gSeen).length);
      setNewAnns(anns.filter((a) => new Date(a.createdAt).getTime() > aSeen).length);
    }

    recount();
    const onStorage = () => recount();
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname, teamSlug]);

  return { newGames, newAnns };
}
