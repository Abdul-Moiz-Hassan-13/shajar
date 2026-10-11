"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";

export function NavBar() {
  const pathname = usePathname();
  const { t, toggleLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const {
    isActualAdmin,
    isPreviewingNonAdmin,
    toggleAdminPreview,
    logout,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const LINKS = [
    { href: "/", label: t.nav.home },
    { href: "/people", label: t.nav.people },
    { href: "/tree", label: t.nav.tree },
    { href: "/relations", label: t.nav.relations },
    { href: "/families", label: t.nav.families },
  ];

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="brand-logo flex items-center text-xl font-bold">
          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            {t.brand}
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <ul className="navbar-desktop-links hidden gap-6 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    isActive(link.href)
                      ? "font-medium underline underline-offset-4"
                      : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={toggleLocale}
            className="navbar-pill inline-flex shrink-0 items-center justify-center rounded-full border border-black/15 px-3 py-1.5 text-sm font-medium leading-5! hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/20"
          >
            <span className="navbar-pill-label">{t.languageToggle.label}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t.themeToggle.toLight : t.themeToggle.toDark}
            className="navbar-pill inline-flex shrink-0 items-center justify-center rounded-full border border-black/15 px-3 py-1.5 text-sm leading-5! hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/20"
          >
            <span className="navbar-pill-label">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
          {isActualAdmin && (
            <button
              type="button"
              onClick={toggleAdminPreview}
              aria-label={isPreviewingNonAdmin ? t.auth.viewAsAdmin : t.auth.viewAsNonAdmin}
              title={isPreviewingNonAdmin ? t.auth.viewAsAdmin : t.auth.viewAsNonAdmin}
              className="admin-preview-toggle navbar-desktop-action navbar-pill hidden shrink-0 items-center justify-center rounded-full border border-black/15 px-3 py-1.5 text-sm leading-5! hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/20"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                {isPreviewingNonAdmin ? (
                  <>
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                    <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
                    <path d="M12 15.5v2" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 7.2-2.4" strokeLinecap="round" />
                    <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
                    <path d="M12 15.5v2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          )}
          {isActualAdmin && (
            <button
              type="button"
              onClick={logout}
              className="navbar-desktop-action navbar-pill hidden shrink-0 items-center justify-center rounded-full border border-black/15 px-3 py-1.5 text-sm leading-5! hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/20"
            >
              {t.auth.logout}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            className="navbar-mobile-menu relative flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-black/15 p-1.5 transition-colors hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
          >
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out ${
                menuOpen ? "opacity-0 -translate-x-1" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out ${
                menuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>
      <div
        className={`navbar-mobile-dropdown grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          menuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-black/10 transition-transform duration-300 ease-in-out dark:border-white/10 ${
              menuOpen ? "translate-y-0" : "-translate-y-2"
            }`}
          >
            <ul className="navbar-mobile-menu flex flex-col gap-1 px-4 py-3 text-sm">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={
                      isActive(link.href)
                        ? "block rounded-md px-3 py-2 font-medium underline underline-offset-4"
                        : "block rounded-md px-3 py-2 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isActualAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                  >
                    {t.auth.logout}
                  </button>
                </li>
              )}
              {isActualAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      toggleAdminPreview();
                      setMenuOpen(false);
                    }}
                    className="admin-preview-toggle block w-full rounded-md px-3 py-2 text-left text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                  >
                    {isPreviewingNonAdmin ? t.auth.viewAsAdmin : t.auth.viewAsNonAdmin}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
