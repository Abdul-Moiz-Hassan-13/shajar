"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function NavBar() {
  const pathname = usePathname();
  const { t, toggleLocale } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const LINKS = [
    { href: "/", label: t.nav.home },
    { href: "/people", label: t.nav.people },
    { href: "/tree", label: t.nav.tree },
    { href: "/relations", label: t.nav.relations },
  ];

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/60">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="brand-logo flex items-center text-xl font-bold">
          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            {t.brand}
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <ul className="hidden gap-6 text-sm sm:flex">
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
            className="shrink-0 rounded-full border border-black/15 px-3 py-1.5 text-sm font-medium hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/20"
          >
            {t.languageToggle.label}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-black/15 p-2 sm:hidden dark:border-white/20"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>
        </div>
      </nav>
      {menuOpen && (
        <ul className="flex flex-col gap-1 border-t border-black/10 px-4 py-3 text-sm sm:hidden dark:border-white/10">
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
        </ul>
      )}
    </header>
  );
}
