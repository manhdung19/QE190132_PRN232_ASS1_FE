"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AUTH_SESSION_CHANGED, clearSession, getSession, type AuthSession } from "@/lib/auth-session";
import { AdminSessionContext } from "@/components/admin-session-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const checkSession = () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      const current = getSession();
      if (!current) {
        setSession(null);
        router.replace("/login");
        return;
      }
      setSession(current);
      const remaining = new Date(current.expiresAt).getTime() - Date.now();
      expiryTimer = setTimeout(() => {
        clearSession();
        setSession(null);
        router.replace("/login");
      }, Math.min(Math.max(remaining, 0), 2_147_483_647));
    };
    checkSession();
    window.addEventListener(AUTH_SESSION_CHANGED, checkSession);
    window.addEventListener("storage", checkSession);
    return () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      window.removeEventListener(AUTH_SESSION_CHANGED, checkSession);
      window.removeEventListener("storage", checkSession);
    };
  }, [router]);

  if (!session) {
    return <div role="status" className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-slate-600">Đang kiểm tra phiên đăng nhập…</div>;
  }
  return <AdminSessionContext.Provider value={session}>{children}</AdminSessionContext.Provider>;
}
