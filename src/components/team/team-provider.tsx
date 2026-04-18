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
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("slug", teamSlug)
        .single();

      if (!error && data) {
        setTeam({
          id: data.id,
          slug: data.slug,
          name: data.name,
          shortName: data.short_name,
          passcode: data.passcode,
          adminPasscode: data.admin_passcode,
        });
      }
      setLoading(false);
    }
    loadTeam();
  }, [teamSlug]);

  return (
    <TeamContext.Provider value={{ team, teamSlug, loading }}>
      {children}
    </TeamContext.Provider>
  );
}
