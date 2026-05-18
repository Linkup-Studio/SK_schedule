"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTeamLink } from "@/hooks/use-team-link";

/**
 * 戻るボタン用フック。
 * ブラウザ履歴があれば直前のページへ戻り（フィルター等の状態を保ったまま）、
 * 履歴が無い場合（直リンク・新規タブ等）だけ fallbackPath へ遷移する。
 */
export function useGoBack(fallbackPath: string) {
  const router = useRouter();
  const teamLink = useTeamLink();
  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(teamLink(fallbackPath));
    }
  }, [router, teamLink, fallbackPath]);
}
