"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function LoginWelcome() {
  const { t } = useLanguage();

  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-10 text-white md:flex md:flex-col md:justify-between lg:p-12">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border-[24px] border-white/10" />
      <div className="relative">
        <p className="max-w-xs text-2xl font-semibold leading-tight lg:text-3xl">
          {t.auth.loginDescription}
        </p>
      </div>
      <ul className="relative space-y-5 text-sm text-white/85">
        {[t.auth.featureTree, t.auth.featureStories, t.auth.featurePrivate].map(
          (feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
