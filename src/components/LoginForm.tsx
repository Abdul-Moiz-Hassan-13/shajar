"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function LoginForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setSubmitting(false);
        setError(
          res.status === 401 ? t.auth.invalidCredentials : t.auth.genericError,
        );
        return;
      }

      // Full reload so the root layout re-reads the new session cookie
      // server-side instead of leaving AuthProvider's client state stale.
      window.location.href = "/";
    } catch {
      setSubmitting(false);
      setError(t.auth.genericError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>{t.auth.email}</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-black/15 bg-black/[0.02] px-4 py-2.5 outline-none transition placeholder:text-black/35 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-white/20 dark:bg-white/[0.03] dark:placeholder:text-white/35"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>{t.auth.password}</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/15 bg-black/[0.02] px-4 py-2.5 pr-12 outline-none transition placeholder:text-black/35 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-white/20 dark:bg-white/[0.03] dark:placeholder:text-white/35"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-black/50 transition hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400"
          >
            <svg
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
              <circle cx={12} cy={12} r={3} />
              {showPassword && <line x1={2} y1={22} x2={22} y2={2} />}
            </svg>
          </button>
        </div>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-500 hover:to-teal-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t.auth.signingIn : t.auth.signIn}
      </button>
      <p className="flex items-center justify-center gap-2 text-center text-xs text-black/50 dark:text-white/50">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-emerald-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        {t.auth.secureMessage}
      </p>
    </form>
  );
}
