"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TeamInfo {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  passcode: string;
  adminPasscode: string;
  staffPin?: string;
}

interface TeamContextValue {
  team: TeamInfo | null;
  teamSlug: string;
  loading: boolean;
}

const TeamContext = createContext<TeamContextValue>({
  team: null,
  teamSlug: "",
  loading: true,
});

export function useTeam() {
  return useContext(TeamContext);
}

export function TeamProvider({
  teamSlug,
  children,
}: {
  teamSlug: string;
  children: React.ReactNode;
}) {
  const cacheKey = `team_cache_${teamSlug}`;

  const [team, setTeam] = useState<TeamInfo | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !localStorage.getItem(cacheKey);
  });

  useEffect(() => {
    async function loadTeam() {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamSlug)
        .single();

      if (!error && data) {
        const teamRow = data as {
          id: string;
          slug?: string | null;
          name: string;
          short_name?: string | null;
          passcode?: string | null;
          passphrase?: string | null;
          admin_passcode?: string | null;
          admin_pin?: string | null;
          staff_pin?: string | null;
        };
        const teamData: TeamInfo = {
          id: teamRow.id,
          slug: teamRow.slug ?? teamRow.id,
          name: teamRow.name,
          shortName: teamRow.short_name ?? teamRow.id.toUpperCase(),
          passcode: teamRow.passphrase ?? teamRow.passcode ?? "",
          adminPasscode: teamRow.admin_pin ?? teamRow.admin_passcode ?? "",
          staffPin: teamRow.staff_pin ?? undefined,
        };
        setTeam(teamData);
        localStorage.setItem(cacheKey, JSON.stringify(teamData));
      }
      setLoading(false);
    }
    loadTeam();
  }, [teamSlug, cacheKey]);

  return (
    <TeamContext.Provider value={{ team, teamSlug, loading }}>
      {children}
    </TeamContext.Provider>
  );
}
