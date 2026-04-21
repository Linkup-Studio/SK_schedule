import { supabase } from "./supabase";
import { resolveTeamId } from "./supabase-data";
import type { ScorebookGame, LineupEntry, AtBat } from "./scorebook-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toScorebookGame(row: Record<string, any>): ScorebookGame {
  return {
    id: row.id,
    teamId: row.team_id,
    gameId: row.game_id,
    opponent: row.opponent,
    ourTeamName: row.our_team_name,
    inningScoresUs: row.inning_scores_us ?? [],
    inningScoresThem: row.inning_scores_them ?? [],
    totalScoreUs: row.total_score_us ?? 0,
    totalScoreThem: row.total_score_them ?? 0,
    totalInnings: row.total_innings ?? 7,
    isHome: row.is_home ?? true,
    status: row.status,
    currentInning: row.current_inning ?? 1,
    currentHalf: row.current_half ?? "top",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLineupEntry(row: Record<string, any>): LineupEntry {
  return {
    id: row.id,
    scorebookGameId: row.scorebook_game_id,
    playerName: row.player_name,
    battingOrder: row.batting_order,
    position: row.position,
    isStarter: row.is_starter,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAtBat(row: Record<string, any>): AtBat {
  return {
    id: row.id,
    scorebookGameId: row.scorebook_game_id,
    playerName: row.player_name,
    inning: row.inning,
    result: row.result,
    rbi: row.rbi ?? 0,
    createdAt: row.created_at,
  };
}

export async function createScorebookGame(
  teamSlug: string,
  gameId: string,
  opponent: string,
  isHome: boolean
): Promise<ScorebookGame | null> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return null;

  const { data, error } = await supabase
    .from("scorebook_games")
    .insert({
      team_id: teamId,
      game_id: gameId,
      opponent,
      our_team_name: "SK",
      is_home: isHome,
      status: "lineup",
    })
    .select()
    .single();

  if (error) {
    console.error("スコアブック作成に失敗:", error.message);
    return null;
  }
  return data ? toScorebookGame(data) : null;
}

export async function fetchScorebookByGameId(gameId: string): Promise<ScorebookGame | null> {
  const { data, error } = await supabase
    .from("scorebook_games")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data ? toScorebookGame(data) : null;
}

export async function fetchScorebookById(id: string): Promise<ScorebookGame | null> {
  const { data, error } = await supabase
    .from("scorebook_games")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data ? toScorebookGame(data) : null;
}

export async function fetchScorebookGames(teamSlug: string): Promise<ScorebookGame[]> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("scorebook_games")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("スコアブック一覧の取得に失敗:", error.message);
    return [];
  }
  return (data ?? []).map(toScorebookGame);
}

export async function updateScorebookGame(
  id: string,
  updates: Partial<{
    inningScoresUs: number[];
    inningScoresThem: number[];
    totalScoreUs: number;
    totalScoreThem: number;
    status: string;
    currentInning: number;
    currentHalf: string;
  }>
): Promise<ScorebookGame | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.inningScoresUs !== undefined) dbUpdates.inning_scores_us = updates.inningScoresUs;
  if (updates.inningScoresThem !== undefined) dbUpdates.inning_scores_them = updates.inningScoresThem;
  if (updates.totalScoreUs !== undefined) dbUpdates.total_score_us = updates.totalScoreUs;
  if (updates.totalScoreThem !== undefined) dbUpdates.total_score_them = updates.totalScoreThem;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.currentInning !== undefined) dbUpdates.current_inning = updates.currentInning;
  if (updates.currentHalf !== undefined) dbUpdates.current_half = updates.currentHalf;

  const { data, error } = await supabase
    .from("scorebook_games")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("スコアブック更新に失敗:", error.message);
    return null;
  }
  return data ? toScorebookGame(data) : null;
}

export async function saveLineup(
  scorebookGameId: string,
  lineup: { playerName: string; battingOrder: number; position: number | null }[]
): Promise<boolean> {
  await supabase.from("scorebook_lineup").delete().eq("scorebook_game_id", scorebookGameId);

  const rows = lineup.map((l) => ({
    scorebook_game_id: scorebookGameId,
    player_name: l.playerName,
    batting_order: l.battingOrder,
    position: l.position,
    is_starter: true,
  }));

  const { error } = await supabase.from("scorebook_lineup").insert(rows);
  if (error) {
    console.error("ラインナップ保存に失敗:", error.message);
    return false;
  }
  return true;
}

export async function fetchLineup(scorebookGameId: string): Promise<LineupEntry[]> {
  const { data, error } = await supabase
    .from("scorebook_lineup")
    .select("*")
    .eq("scorebook_game_id", scorebookGameId)
    .order("batting_order", { ascending: true });

  if (error) {
    console.error("ラインナップ取得に失敗:", error.message);
    return [];
  }
  return (data ?? []).map(toLineupEntry);
}

export async function addAtBat(
  scorebookGameId: string,
  playerName: string,
  inning: number,
  result: string,
  rbi: number
): Promise<AtBat | null> {
  const { data, error } = await supabase
    .from("scorebook_at_bats")
    .insert({
      scorebook_game_id: scorebookGameId,
      player_name: playerName,
      inning,
      result,
      rbi,
    })
    .select()
    .single();

  if (error) {
    console.error("打席結果の保存に失敗:", error.message);
    return null;
  }
  return data ? toAtBat(data) : null;
}

export async function fetchAtBats(scorebookGameId: string): Promise<AtBat[]> {
  const { data, error } = await supabase
    .from("scorebook_at_bats")
    .select("*")
    .eq("scorebook_game_id", scorebookGameId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("打席結果の取得に失敗:", error.message);
    return [];
  }
  return (data ?? []).map(toAtBat);
}

export async function deleteAtBat(id: string): Promise<boolean> {
  const { error } = await supabase.from("scorebook_at_bats").delete().eq("id", id);
  if (error) {
    console.error("打席結果の削除に失敗:", error.message);
    return false;
  }
  return true;
}

export async function deleteScorebookGame(id: string): Promise<boolean> {
  const { error } = await supabase.from("scorebook_games").delete().eq("id", id);
  if (error) {
    console.error("スコアブック削除に失敗:", error.message);
    return false;
  }
  return true;
}
