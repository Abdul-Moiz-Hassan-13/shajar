"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextValue {
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialIsAdmin,
}: {
  children: ReactNode;
  /** Read server-side from the (httpOnly) session cookie - it can't be read
   * from client code, so the logged-in state has to arrive as a prop like
   * the locale/theme cookies do. */
  initialIsAdmin: boolean;
}) {
  const [isAdmin] = useState(initialIsAdmin);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // A full reload (rather than router.refresh()) guarantees the root
    // layout re-runs its server-side cookie check and this provider is
    // re-seeded with the new value - a soft navigation wouldn't remount it.
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
