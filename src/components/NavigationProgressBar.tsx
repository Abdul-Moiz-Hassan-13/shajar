"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeNavRef = useRef(false);

  function start() {
    activeNavRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    setProgress(18);
    setVisible(true);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev;
        const diff = Math.max(1, (85 - prev) * 0.16);
        return Math.min(85, prev + diff);
      });
    }, 120);
    completeTimerRef.current = setTimeout(complete, 1800);
  }

  function complete() {
    activeNavRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 250);
    }, 200);
  }

  // Complete when pathname or searchParams change
  useEffect(() => {
    if (activeNavRef.current || visible) {
      complete();
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links & popstate
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as Element)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;

      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const targetUrl = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (targetUrl.origin !== currentUrl.origin) return;
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }

        start();
      } catch {
        // ignore invalid URL
      }
    }

    function handlePopState() {
      start();
    }

    window.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      if (timerRef.current) clearInterval(timerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      dir="ltr"
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[9999] h-[3px] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.85),0_0_6px_rgba(45,212,191,0.6)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
