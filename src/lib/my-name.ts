/**
 * 出欠で使った「自分（選手）の名前」を端末ごとに記憶する。
 * アカウント機能が無いため、これが「個々の判定」の鍵になる。
 */

function myNameKey(teamSlug: string) {
  return `${teamSlug}_my_name`;
}

export function getMyName(teamSlug: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(myNameKey(teamSlug)) ?? "";
}

export function setMyName(teamSlug: string, name: string) {
  if (typeof window === "undefined") return;
  const v = name.trim();
  if (!v) return;
  localStorage.setItem(myNameKey(teamSlug), v);
  // 他コンポーネント（カレンダー等）に変更を伝える
  window.dispatchEvent(new Event("storage"));
}
