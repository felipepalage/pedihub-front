export const SESSION_STORAGE_KEY = "pedihub.session";

export interface SessionUser {
  userId: string;
  merchantId: string;
  fullName: string;
  email: string;
  merchantName: string;
  status: string;
  slug: string;
}

export interface SessionSnapshot {
  token: string;
  expiresAt: string;
  user: SessionUser;
}

export function readStoredSession(): SessionSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionSnapshot;
    return parsed.token && parsed.user ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: SessionSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
