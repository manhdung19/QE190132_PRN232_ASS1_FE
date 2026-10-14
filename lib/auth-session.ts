import type { AccountResponse, LoginResponse } from "./types";

const STORAGE_KEY = "tasktrack.auth.session";
export const AUTH_SESSION_CHANGED = "tasktrack:auth-session-changed";

export interface AuthSession {
  token: string;
  account: AccountResponse;
  expiresAt: string;
}

interface JwtClaims {
  accountId: number;
  email: string;
  role: "Staff" | "Admin";
  roleId: 0 | 1;
  exp: number;
}

export function readJwtClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const encoded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(encoded)) as Partial<JwtClaims>;
    if (!Number.isInteger(claims.accountId) || !Number.isInteger(claims.exp) ||
        typeof claims.email !== "string" ||
        (claims.role !== "Staff" && claims.role !== "Admin") ||
        (claims.roleId !== 0 && claims.roleId !== 1) ||
        (claims.role === "Admin") !== (claims.roleId === 1)) return null;
    return claims as JwtClaims;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
}

export function saveSession(response: LoginResponse): AuthSession {
  const claims = readJwtClaims(response.token);
  if (!claims || claims.exp * 1000 <= Date.now() ||
      claims.accountId !== response.account.accountId ||
      claims.email !== response.account.email || claims.roleId !== response.account.role)
    throw new Error("Invalid login session.");
  if (typeof window === "undefined") throw new Error("Login session requires a browser.");
  const session: AuthSession = {
    token: response.token,
    account: response.account,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
  return session;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    const claims = readJwtClaims(session.token);
    if (!claims || claims.exp * 1000 <= Date.now() ||
        claims.accountId !== session.account.accountId ||
        claims.email !== session.account.email || claims.roleId !== session.account.role) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function redirectToLogin(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/login")
    window.location.replace("/login");
}
