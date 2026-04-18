export interface TeamConfig {
  slug: string;
  name: string;
  shortName: string;
}

export const TEAMS: TeamConfig[] = [
  { slug: "sk", name: "一色SKクラブ", shortName: "SK" },
  { slug: "demo", name: "デモチーム", shortName: "DEMO" },
];

export const DEFAULT_TEAM_SLUG = "sk";

export function getTeamBySlug(slug: string): TeamConfig | undefined {
  return TEAMS.find((t) => t.slug === slug);
}

export function getAllTeamSlugs(): string[] {
  return TEAMS.map((t) => t.slug);
}
