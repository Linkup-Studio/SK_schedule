"use client";

import { useTeam } from "@/components/team/team-provider";

export function useTeamLink() {
  const { teamSlug } = useTeam();
  return (path: string) => `/${teamSlug}${path}`;
}
