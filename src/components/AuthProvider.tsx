"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextValue {
  isAdmin: boolean;
  isActualAdmin: boolean;
  isPreviewingNonAdmin: boolean;
  toggleAdminPreview: () => void;
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
  const [isPreviewingNonAdmin, setIsPreviewingNonAdmin] = useState(false);
  const isAdmin = initialIsAdmin && !isPreviewingNonAdmin;

  function toggleAdminPreview() {
    setIsPreviewingNonAdmin((previous) => !previous);
  }

  useEffect(() => {
    if (!initialIsAdmin) return;

    function refreshRestoredPage(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload();
    }

    window.addEventListener("pageshow", refreshRestoredPage);
    return () => window.removeEventListener("pageshow", refreshRestoredPage);
  }, [initialIsAdmin]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // A full reload (rather than router.refresh()) guarantees the root
    // layout re-runs its server-side cookie check and this provider is
    // re-seeded with the new value - a soft navigation wouldn't remount it.
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        isActualAdmin: initialIsAdmin,
        isPreviewingNonAdmin,
        toggleAdminPreview,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
