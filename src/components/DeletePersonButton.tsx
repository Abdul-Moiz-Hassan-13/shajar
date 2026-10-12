"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function DeletePersonButton({
  id,
  name,
  onDeleted,
  compact = false,
}: {
  id: string;
  name: string;
  onDeleted?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    setError(false);
    setDeleting(true);
    const response = await fetch(`/api/people/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setDeleting(false);
      setError(true);
      return;
    }
    setConfirmOpen(false);
    if (onDeleted) {
      onDeleted();
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setConfirmOpen(true);
        }}
        disabled={deleting}
        className={`delete-person-button rounded-lg border border-red-700 bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 dark:border-red-600 dark:bg-red-600 dark:hover:bg-red-700 ${
          compact ? "py-1.5" : "py-2.5"
        }`}
      >
        {deleting ? t.deletePerson.deleting : t.deletePerson.delete}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {t.form.somethingWrong}
        </span>
      )}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => {
            if (!deleting) setConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-person-title-${id}`}
            className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 text-start shadow-2xl dark:border-white/10 dark:bg-neutral-900"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={`delete-person-title-${id}`}
              className="text-lg font-semibold"
            >
              {t.deletePerson.confirm(name)}
            </h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {t.deletePerson.warning}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
              >
                {t.form.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {deleting ? t.deletePerson.deleting : t.deletePerson.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
