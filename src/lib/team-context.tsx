"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "./supabase";
import { toTeam, type Team } from "./team-types";

interface TeamContextValue {
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  isLoading: boolean;
  /** 合言葉でチームを検索 */
  findTeamByPassphrase: (passphrase: string) => Promise<Team | null>;
  /** ログアウト（チーム選択に戻る） */
  logout: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

const STORAGE_KEY = "ballpark_team_id";

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 起動時: localStorageに保存されたteam_idで自動復元
  useEffect(() => {
    const savedTeamId = localStorage.getItem(STORAGE_KEY);
    if (savedTeamId) {
      supabase
        .from("teams")
        .select("*")
        .eq("id", savedTeamId)
        .single()
        .then(({ data }) => {
          if (data) setCurrentTeam(toTeam(data));
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // チーム変更時にlocalStorageに保存
  useEffect(() => {
    if (currentTeam) {
      localStorage.setItem(STORAGE_KEY, currentTeam.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentTeam]);

  const findTeamByPassphrase = async (passphrase: string): Promise<Team | null> => {
    console.log("[DEBUG] findTeamByPassphrase called with:", passphrase);
    console.log("[DEBUG] supabaseUrl:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[DEBUG] anonKey prefix:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));

    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("passphrase", passphrase)
      .single();

    console.log("[DEBUG] query result - data:", data, "error:", error);

    if (error || !data) return null;
    return toTeam(data);
  };

  const logout = () => {
    setCurrentTeam(null);
    localStorage.removeItem(STORAGE_KEY);
    // 管理者モードもリセット
    localStorage.removeItem("sk_admin");
  };

  return (
    <TeamContext.Provider
      value={{ currentTeam, setCurrentTeam, isLoading, findTeamByPassphrase, logout }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be inside TeamProvider");
  return ctx;
}
