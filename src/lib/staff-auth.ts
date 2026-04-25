const STAFF_SESSION_DAYS = 30;
const STAFF_SESSION_MS = STAFF_SESSION_DAYS * 24 * 60 * 60 * 1000;

function staffKey(teamSlug: string) {
  return `${teamSlug}_staff`;
}

function staffLastSeenKey(teamSlug: string) {
  return `${teamSlug}_staff_last_seen`;
}

export function isStaffModeActive(teamSlug: string): boolean {
  if (typeof window === "undefined") return false;

  const isStaff = localStorage.getItem(staffKey(teamSlug)) === "true";
  if (!isStaff) return false;

  const lastSeen = localStorage.getItem(staffLastSeenKey(teamSlug));
  if (!lastSeen) {
    deactivateStaffMode(teamSlug);
    return false;
  }

  const lastSeenTime = new Date(lastSeen).getTime();
  if (Number.isNaN(lastSeenTime) || Date.now() - lastSeenTime > STAFF_SESSION_MS) {
    deactivateStaffMode(teamSlug);
    return false;
  }

  return true;
}

export function activateStaffMode(teamSlug: string) {
  localStorage.setItem(staffKey(teamSlug), "true");
  touchStaffMode(teamSlug);
  window.dispatchEvent(new Event("storage"));
}

export function deactivateStaffMode(teamSlug: string) {
  localStorage.removeItem(staffKey(teamSlug));
  localStorage.removeItem(staffLastSeenKey(teamSlug));
  window.dispatchEvent(new Event("storage"));
}

export function touchStaffMode(teamSlug: string) {
  localStorage.setItem(staffLastSeenKey(teamSlug), new Date().toISOString());
}
