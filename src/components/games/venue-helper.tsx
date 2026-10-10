"use client";

/**
 * 会場の入力を助ける部品（予定の作成・編集で共通。ひろ指示 10/10）
 * - 前に使った会場: 会場名を打つと過去の予定の会場が候補に出て、押すと会場名と住所がまとめて入る
 * - 地図で確かめる: Googleマップで候補を見て正しい場所を選び、その住所を「会場住所」に入れてもらう
 *   （住所が入っていると、みんなが会場を押した時にその住所で地図が開く＝同じ名前の別の場所に行かない）
 */
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, History } from "lucide-react";
import { fetchGames } from "@/lib/supabase-data";

interface Props {
  teamSlug: string;
  venueName: string;
  venueAddress: string;
  onPick: (name: string, address: string) => void;
}

interface PastVenue {
  name: string;
  address: string;
}

export function VenueHelper({ teamSlug, venueName, venueAddress, onPick }: Props) {
  const [past, setPast] = useState<PastVenue[]>([]);

  useEffect(() => {
    let alive = true;
    fetchGames(teamSlug).then((games) => {
      if (!alive) return;
      // 会場名ごとに、住所が入っている一番新しい予定の住所を採る
      const byName = new Map<string, PastVenue>();
      for (const g of [...games].sort((a, b) => b.dateStart.localeCompare(a.dateStart))) {
        const name = g.venueName?.trim();
        if (!name || name === "休日") continue;
        const cur = byName.get(name);
        if (!cur) byName.set(name, { name, address: g.venueAddress?.trim() ?? "" });
        else if (!cur.address && g.venueAddress?.trim()) cur.address = g.venueAddress.trim();
      }
      setPast([...byName.values()]);
    });
    return () => { alive = false; };
  }, [teamSlug]);

  const typed = venueName.trim();
  const suggestions = useMemo(() => {
    if (!typed) return [];
    return past
      .filter((v) => v.name.includes(typed) && !(v.name === typed && v.address === venueAddress.trim()))
      .slice(0, 5);
  }, [past, typed, venueAddress]);

  const query = [typed, venueAddress.trim()].filter(Boolean).join(" ");

  return (
    <div className="space-y-2 -mt-1.5">
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[11px] font-bold text-muted"><History className="w-3 h-3" />前に使った会場（押すと住所もまとめて入ります）</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((v) => (
              <button key={v.name} type="button" onClick={() => onPick(v.name, v.address)} className="text-left px-3 py-2 rounded-xl border border-border bg-background active:scale-[0.98] transition-transform">
                <span className="block text-[13px] font-bold">{v.name}</span>
                {v.address && <span className="block text-[11px] text-muted">{v.address}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      {typed && (
        <div className="rounded-xl bg-info/10 px-3 py-2.5 space-y-1.5">
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-bold text-primary">
            <ExternalLink className="w-3.5 h-3.5" />地図で確かめる
          </a>
          <p className="text-[11px] text-muted leading-relaxed">
            同じ名前の場所がいくつか出たら、正しい場所を選んで、その住所を下の「会場住所」に入れてください。<br />
            住所が入っていると、みんなが会場を押した時にその場所の地図が開きます。
          </p>
        </div>
      )}
    </div>
  );
}
