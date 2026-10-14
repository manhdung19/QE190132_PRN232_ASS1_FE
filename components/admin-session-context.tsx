"use client";

import { createContext, useContext } from "react";
import type { AuthSession } from "@/lib/auth-session";

export const AdminSessionContext = createContext<AuthSession | null>(null);

export function useAdminSession(): AuthSession {
  const session = useContext(AdminSessionContext);
  if (!session) throw new Error("Admin session is unavailable outside the admin guard.");
  return session;
}
