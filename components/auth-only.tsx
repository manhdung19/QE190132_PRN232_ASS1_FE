"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { AUTH_SESSION_CHANGED, getSession, type AuthSession } from "@/lib/auth-session";

export function useAuthSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(null);
  useEffect(() => {
    const sync = () => setSession(getSession());
    queueMicrotask(sync);
    window.addEventListener(AUTH_SESSION_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return session;
}

export function AuthOnly({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const session = useAuthSession();
  if (!session || (adminOnly && session.account.role !== 1)) return null;
  return <>{children}</>;
}

export function ProtectedLink(props: ComponentProps<typeof Link>) {
  return <AuthOnly><Link {...props} /></AuthOnly>;
}
