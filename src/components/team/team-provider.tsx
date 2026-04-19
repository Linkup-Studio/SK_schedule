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
        const teamData: TeamInfo = {
          id: data.id,
          slug: data.id,
          name: data.name,
          shortName: data.id.toUpperCase(),
          passcode: data.passphrase,
          adminPasscode: data.admin_pin,
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
