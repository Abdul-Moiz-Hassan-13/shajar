"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function DeletePersonButton({
  id,
  name,
  onDeleted,
}: {
  id: string;
  name: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  async function handleDelete() {
    if (!confirm(t.deletePerson.confirm(name))) return;
    setError(false);
    setDeleting(true);
    const response = await fetch(`/api/people/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setDeleting(false);
      setError(true);
      return;
    }
    if (onDeleted) {
      onDeleted();
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={(event) => {
          event.stopPropagation();
          handleDelete();
        }}
        disabled={deleting}
        className="rounded-xl border border-red-700 bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600"
      >
        {deleting ? t.deletePerson.deleting : t.deletePerson.delete}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {t.form.somethingWrong}
        </span>
      )}
    </div>
  );
}
