import { TeamProvider } from "@/components/team/team-provider";
import { getAllTeamSlugs } from "@/lib/teams-config";

export function generateStaticParams() {
  return getAllTeamSlugs().map((slug) => ({ teamId: slug }));
}

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <TeamProvider teamSlug={teamId}>{children}</TeamProvider>;
}
