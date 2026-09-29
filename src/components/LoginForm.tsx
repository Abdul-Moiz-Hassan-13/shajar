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
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        {t.auth.email}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t.auth.password}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-black/15 px-3 py-2 pr-10 dark:border-white/20 dark:bg-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
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
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {submitting ? t.auth.signingIn : t.auth.signIn}
      </button>
    </form>
  );
}
