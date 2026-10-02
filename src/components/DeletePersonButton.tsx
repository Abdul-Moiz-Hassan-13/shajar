"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function DeletePersonButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(t.deletePerson.confirm(name))) return;
    setDeleting(true);
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        handleDelete();
      }}
      disabled={deleting}
      className="rounded-md border border-red-700 bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600"
    >
      {deleting ? t.deletePerson.deleting : t.deletePerson.delete}
    </button>
  );
}
