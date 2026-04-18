"use client";

import { useCallback } from "react";
import { useTeam } from "@/components/team/team-provider";

export function useTeamLink() {
  const { teamSlug } = useTeam();
  return useCallback((path: string) => `/${teamSlug}${path}`, [teamSlug]);
}
