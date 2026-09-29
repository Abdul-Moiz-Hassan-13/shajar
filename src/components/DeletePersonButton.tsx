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
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {deleting ? t.deletePerson.deleting : t.deletePerson.delete}
    </button>
  );
}
