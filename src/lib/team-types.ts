/** チーム情報（teamsテーブルの型） */
export interface Team {
  id: string;
  name: string;
  slug: string;
  themeColor: string;
  themeColorLight: string;
  description?: string;
  passphrase: string;
  adminPin: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
}

/** DB行 → Team 変換 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTeam(row: Record<string, any>): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    themeColor: row.theme_color,
    themeColorLight: row.theme_color_light,
    description: row.description ?? undefined,
    passphrase: row.passphrase,
    adminPin: row.admin_pin,
    logoUrl: row.logo_url ?? undefined,
    settings: row.settings ?? {},
  };
}
