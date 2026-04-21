export interface ScorebookGame {
  id: string;
  teamId: string;
  gameId: string;
  opponent: string;
  ourTeamName: string;
  inningScoresUs: number[];
  inningScoresThem: number[];
  totalScoreUs: number;
  totalScoreThem: number;
  totalInnings: number;
  isHome: boolean;
  status: "setup" | "lineup" | "live" | "completed";
  currentInning: number;
  currentHalf: "top" | "bottom";
  createdAt: string;
  updatedAt: string;
}

export interface LineupEntry {
  id: string;
  scorebookGameId: string;
  playerName: string;
  battingOrder: number;
  position: number | null;
  isStarter: boolean;
  createdAt: string;
}

export type AtBatResult =
  | "single"
  | "double"
  | "triple"
  | "homerun"
  | "walk"
  | "hit_by_pitch"
  | "strikeout"
  | "groundout"
  | "flyout"
  | "sacrifice"
  | "error"
  | "fielders_choice";

export interface AtBat {
  id: string;
  scorebookGameId: string;
  playerName: string;
  inning: number;
  result: AtBatResult;
  rbi: number;
  createdAt: string;
}

export const POSITIONS: Record<number, { label: string; short: string }> = {
  1: { label: "投手", short: "投" },
  2: { label: "捕手", short: "捕" },
  3: { label: "一塁手", short: "一" },
  4: { label: "二塁手", short: "二" },
  5: { label: "三塁手", short: "三" },
  6: { label: "遊撃手", short: "遊" },
  7: { label: "左翼手", short: "左" },
  8: { label: "中堅手", short: "中" },
  9: { label: "右翼手", short: "右" },
};

export const AT_BAT_RESULTS: Record<AtBatResult, { label: string; short: string; color: string }> = {
  single: { label: "安打", short: "安", color: "text-blue-600" },
  double: { label: "二塁打", short: "二", color: "text-blue-700" },
  triple: { label: "三塁打", short: "三", color: "text-purple-600" },
  homerun: { label: "本塁打", short: "本", color: "text-red-600" },
  walk: { label: "四球", short: "四", color: "text-green-600" },
  hit_by_pitch: { label: "死球", short: "死", color: "text-green-700" },
  strikeout: { label: "三振", short: "K", color: "text-gray-500" },
  groundout: { label: "ゴロ", short: "ゴ", color: "text-gray-500" },
  flyout: { label: "フライ", short: "飛", color: "text-gray-500" },
  sacrifice: { label: "犠打", short: "犠", color: "text-amber-600" },
  error: { label: "エラー", short: "E", color: "text-orange-600" },
  fielders_choice: { label: "野選", short: "野", color: "text-gray-600" },
};
