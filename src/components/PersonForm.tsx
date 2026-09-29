"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { displayFullName } from "@/lib/personName";
import type { Person, PersonInput } from "@/lib/types";

interface PersonFormProps {
  person?: Person;
  people: Person[];
}

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function PersonForm({ person, people }: PersonFormProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [firstName, setFirstName] = useState(person?.firstName ?? "");
  const [lastName, setLastName] = useState(person?.lastName ?? "");
  const [firstNameUr, setFirstNameUr] = useState(person?.firstNameUr ?? "");
  const [lastNameUr, setLastNameUr] = useState(person?.lastNameUr ?? "");
  const [gender, setGender] = useState(person?.gender ?? "other");
  const [isDeceased, setIsDeceased] = useState(person?.isDeceased ?? false);
  const [notes, setNotes] = useState(person?.notes ?? "");
  const [parentIds, setParentIds] = useState<string[]>(
    person?.parentIds ?? [],
  );
  const [siblingOrder, setSiblingOrder] = useState(
    person?.siblingOrder?.toString() ?? "",
  );
  const [spouseIds, setSpouseIds] = useState<string[]>(
    person?.spouseIds ?? [],
  );
  const [divorcedSpouseIds, setDivorcedSpouseIds] = useState<string[]>(
    person?.divorcedSpouseIds ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [parentQuery, setParentQuery] = useState("");
  const [spouseQuery, setSpouseQuery] = useState("");

  const otherPeople = people
    .filter((p) => p.id !== person?.id)
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const parentCandidates = otherPeople.filter(
    (p) =>
      parentIds.includes(p.id) ||
      fullName(p).toLowerCase().includes(parentQuery.trim().toLowerCase()),
  );
  const spouseCandidates = otherPeople.filter(
    (p) =>
      spouseIds.includes(p.id) ||
      fullName(p).toLowerCase().includes(spouseQuery.trim().toLowerCase()),
  );

  function toggleParent(id: string) {
    setParentIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function toggleSpouse(id: string) {
    setSpouseIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
    setDivorcedSpouseIds((prev) => prev.filter((p) => p !== id));
  }

  function toggleDivorced(id: string) {
    setDivorcedSpouseIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const input: PersonInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      firstNameUr: firstNameUr.trim() || undefined,
      lastNameUr: lastNameUr.trim() || undefined,
      gender,
      isDeceased,
      notes: notes || undefined,
      parentIds,
      spouseIds,
      divorcedSpouseIds,
      siblingOrder: siblingOrder ? Number(siblingOrder) : undefined,
    };

    const url = person ? `/api/people/${person.id}` : "/api/people";
    const method = person ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t.form.somethingWrong);
      return;
    }

    router.refresh();
    router.back();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-xl">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t.form.firstName}
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.form.lastName}
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.form.firstNameUr}
          <input
            dir="rtl"
            value={firstNameUr}
            onChange={(e) => setFirstNameUr(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.form.lastNameUr}
          <input
            dir="rtl"
            value={lastNameUr}
            onChange={(e) => setLastNameUr(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {t.form.gender}
        <select
          value={gender}
          onChange={(e) =>
            setGender(e.target.value as Person["gender"])
          }
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-black dark:border-white/20 dark:bg-neutral-900 dark:text-white"
        >
          <option value="male" className="bg-white text-black dark:bg-neutral-900 dark:text-white">
            {t.form.male}
          </option>
          <option value="female" className="bg-white text-black dark:bg-neutral-900 dark:text-white">
            {t.form.female}
          </option>
          <option value="other" className="bg-white text-black dark:bg-neutral-900 dark:text-white">
            {t.form.other}
          </option>
        </select>
      </label>

      <label className="flex items-center justify-between gap-2 rounded-md border border-black/15 p-3 text-sm font-medium dark:border-white/20">
        {t.form.deceased}
        <button
          type="button"
          role="switch"
          aria-checked={isDeceased}
          onClick={() => setIsDeceased((prev) => !prev)}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{
            backgroundColor: isDeceased ? "#10b981" : "#71717a",
          }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
            style={{ left: isDeceased ? "22px" : "2px" }}
          />
        </button>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t.form.notes}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t.form.siblingOrder}
        <input
          type="number"
          value={siblingOrder}
          onChange={(e) => setSiblingOrder(e.target.value)}
          placeholder={t.form.siblingOrderPlaceholder}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">
          {t.form.parents}
        </legend>
        {otherPeople.length > 0 && (
          <input
            type="search"
            value={parentQuery}
            onChange={(e) => setParentQuery(e.target.value)}
            placeholder={t.form.searchPlaceholder}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
          />
        )}
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-md border border-black/15 p-2 dark:border-white/20">
          {otherPeople.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">
              {t.form.noOtherPeople}
            </p>
          )}
          {otherPeople.length > 0 && parentCandidates.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">
              {t.form.noMatches}
            </p>
          )}
          {parentCandidates.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={parentIds.includes(p.id)}
                disabled={
                  !parentIds.includes(p.id) && parentIds.length >= 2
                }
                onChange={() => toggleParent(p.id)}
              />
              {displayFullName(p, locale)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t.form.spouses}</legend>
        {otherPeople.length > 0 && (
          <input
            type="search"
            value={spouseQuery}
            onChange={(e) => setSpouseQuery(e.target.value)}
            placeholder={t.form.searchPlaceholder}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
          />
        )}
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-md border border-black/15 p-2 dark:border-white/20">
          {otherPeople.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">
              {t.form.noOtherPeople}
            </p>
          )}
          {otherPeople.length > 0 && spouseCandidates.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">
              {t.form.noMatches}
            </p>
          )}
          {spouseCandidates.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={spouseIds.includes(p.id)}
                  onChange={() => toggleSpouse(p.id)}
                />
                {displayFullName(p, locale)}
              </label>
              {spouseIds.includes(p.id) && (
                <label className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
                  <input
                    type="checkbox"
                    checked={divorcedSpouseIds.includes(p.id)}
                    onChange={() => toggleDivorced(p.id)}
                  />
                  {t.form.divorced}
                </label>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? t.form.saving : t.form.save}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          {t.form.cancel}
        </button>
      </div>
    </form>
  );
}
