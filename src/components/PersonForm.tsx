"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeletePersonButton } from "@/components/DeletePersonButton";
import { useLanguage } from "@/components/LanguageProvider";
import { displayFullName } from "@/lib/personName";
import type { Gender, Person, PersonInput } from "@/lib/types";

interface PersonFormProps {
  person?: Person;
  people: Person[];
  onSaved?: (person: Person) => void;
  allowRelationships?: boolean;
  restrictedGender?: Exclude<Gender, "other">;
  returnTo?: string;
}

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function PersonForm({
  person,
  people,
  onSaved,
  allowRelationships = true,
  restrictedGender,
  returnTo,
}: PersonFormProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [firstName, setFirstName] = useState(person?.firstName ?? "");
  const [lastName, setLastName] = useState(person?.lastName ?? "");
  const [firstNameUr, setFirstNameUr] = useState(person?.firstNameUr ?? "");
  const [lastNameUr, setLastNameUr] = useState(person?.lastNameUr ?? "");
  const [gender, setGender] = useState<Person["gender"]>(
    restrictedGender ?? person?.gender ?? "male",
  );
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
  const [childIds, setChildIds] = useState<string[]>(
    person ? people.filter((p) => p.parentIds.includes(person.id)).map((p) => p.id) : [],
  );
  const [divorcedSpouseIds, setDivorcedSpouseIds] = useState<string[]>(
    person?.divorcedSpouseIds ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [availablePeople, setAvailablePeople] = useState(people);
  const [relatedRole, setRelatedRole] = useState<"parent" | "spouse" | "child" | null>(null);

  const [parentQuery, setParentQuery] = useState("");
  const [spouseQuery, setSpouseQuery] = useState("");

  const otherPeople = availablePeople
    .filter((p) => p.id !== person?.id)
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const selectedParentGenders = parentIds
    .map((id) => availablePeople.find((p) => p.id === id)?.gender)
    .filter((value): value is Person["gender"] => Boolean(value));
  const parentCandidates = otherPeople.filter(
    (p) =>
      parentIds.includes(p.id) ||
      ((p.gender !== "male" || !selectedParentGenders.includes("male")) &&
        (p.gender !== "female" || !selectedParentGenders.includes("female")) &&
        fullName(p).toLowerCase().includes(parentQuery.trim().toLowerCase())),
  );
  const spouseCandidates = otherPeople.filter(
    (p) =>
      spouseIds.includes(p.id) ||
      ((gender === "other" || p.gender !== gender) &&
        fullName(p).toLowerCase().includes(spouseQuery.trim().toLowerCase())),
  );
  const canAddSpouse =
    gender === "male" ||
    (gender === "female" &&
      spouseIds.length > 0 &&
      spouseIds.every((id) => availablePeople.find((p) => p.id === id)?.isDeceased));

  function toggleParent(id: string) {
    setParentIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      const candidate = availablePeople.find((p) => p.id === id);
      if (
        candidate &&
        (candidate.gender === "male" || candidate.gender === "female") &&
        prev.some((parentId) => availablePeople.find((p) => p.id === parentId)?.gender === candidate.gender)
      ) {
        return prev;
      }
      return [...prev, id];
    });
  }

  function toggleSpouse(id: string) {
    setSpouseIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      const candidate = availablePeople.find((p) => p.id === id);
      if (
        candidate &&
        (gender === "male" || gender === "female") &&
        candidate.gender === gender
      ) {
        return prev;
      }
      return [...prev, id];
    });
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
      childIds,
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

    const savedPerson = (await res.json()) as Person;
    if (onSaved) {
      onSaved(savedPerson);
      return;
    }
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.refresh();
      router.back();
    }
  }

  const relatedLabel =
    relatedRole === "parent"
      ? t.form.addParent
      : relatedRole === "spouse"
        ? t.form.addSpouse
        : t.form.addChild;
  const relatedGender =
    relatedRole === "spouse" && (gender === "male" || gender === "female")
      ? gender === "male"
        ? "female"
        : "male"
      : relatedRole === "parent"
        ? selectedParentGenders.includes("male")
          ? "female"
          : selectedParentGenders.includes("female")
            ? "male"
            : undefined
        : undefined;

  return (
    <>
      <form onSubmit={handleSubmit} className="person-form flex max-w-xl flex-col gap-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="person-name-grid grid grid-cols-2 gap-4">
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

      {restrictedGender ? (
        <div className="flex flex-col gap-1 text-sm">
          {t.form.gender}
          <div className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20">
            {gender === "male" ? t.form.male : t.form.female}
          </div>
        </div>
      ) : (
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
          </select>
        </label>
      )}

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

      {allowRelationships && (
      <fieldset className="person-form-section flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium">{t.form.parents}</legend>
          {parentIds.length < 2 && (
            <button type="button" onClick={() => setRelatedRole("parent")} className="rounded-lg border px-3 py-1.5 text-sm">
              {t.form.addParent}
            </button>
          )}
        </div>
        {otherPeople.length > 0 && (
          <input
            type="search"
            value={parentQuery}
            onChange={(e) => setParentQuery(e.target.value)}
            placeholder={t.form.searchPlaceholder}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
          />
        )}
        <div className="min-h-0 max-h-56 overflow-y-auto overscroll-contain rounded-md border border-black/15 p-2 dark:border-white/20">
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
            <label key={p.id} className="flex min-h-8 items-center gap-2 text-sm leading-6">
              <input
                type="checkbox"
                checked={parentIds.includes(p.id)}
                disabled={
                  !parentIds.includes(p.id) &&
                  (parentIds.length >= 2 ||
                    selectedParentGenders.includes(p.gender))
                }
                onChange={() => toggleParent(p.id)}
              />
              {displayFullName(p, locale)}
            </label>
          ))}
        </div>
      </fieldset>
      )}

      {allowRelationships && (
      <fieldset className="person-form-section flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium">{t.form.spouses}</legend>
          <button
            type="button"
            disabled={!canAddSpouse}
            onClick={() => setRelatedRole("spouse")}
            title={!canAddSpouse ? t.form.spouseUnavailable : undefined}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t.form.addSpouse}
          </button>
        </div>
        {otherPeople.length > 0 && (
          <input
            type="search"
            value={spouseQuery}
            onChange={(e) => setSpouseQuery(e.target.value)}
            placeholder={t.form.searchPlaceholder}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
          />
        )}
        <div className="min-h-0 max-h-56 overflow-y-auto overscroll-contain rounded-md border border-black/15 p-2 dark:border-white/20">
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
              <label className="flex min-h-8 items-center gap-2 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={spouseIds.includes(p.id)}
                  disabled={
                    !spouseIds.includes(p.id) &&
                    (gender === "male" || gender === "female") &&
                    p.gender === gender
                  }
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
      )}

      {allowRelationships && (
      <fieldset className="person-form-section flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium">{t.form.children}</legend>
          <button type="button" onClick={() => setRelatedRole("child")} className="rounded-lg border px-3 py-1.5 text-sm">
            {t.form.addChild}
          </button>
        </div>
        <div className="min-h-0 max-h-56 overflow-y-auto overscroll-contain rounded-md border border-black/15 p-2 dark:border-white/20">
          {otherPeople.filter((p) => childIds.includes(p.id)).map((child) => (
            <label key={child.id} className="flex min-h-8 items-center gap-2 text-sm leading-6">
              <input
                type="checkbox"
                checked
                onChange={() => setChildIds((prev) => prev.filter((id) => id !== child.id))}
              />
              {displayFullName(child, locale)}
            </label>
          ))}
          {childIds.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">{t.families.noChildren}</p>
          )}
        </div>
      </fieldset>
      )}

      <div className="person-form-actions flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className={`person-form-save rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/80 disabled:hover:bg-black/40 dark:bg-white dark:text-black dark:hover:bg-white/80 dark:disabled:hover:bg-white/80 ${
            person
              ? "disabled:bg-black/40 dark:disabled:bg-white/80"
              : "person-form-save-new disabled:bg-black/20 dark:disabled:bg-white/60"
          }`}
        >
          {saving ? t.form.saving : t.form.save}
        </button>
        {person && (
          <DeletePersonButton
            id={person.id}
            name={displayFullName(person, locale)}
            onDeleted={() => router.push(returnTo ?? "/people")}
          />
        )}
      </div>
      </form>
      {relatedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="my-4 max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-900">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">{relatedLabel}</h2>
              <button type="button" onClick={() => setRelatedRole(null)} className="rounded-lg border px-3 py-1.5 text-sm">
                {t.form.cancel}
              </button>
            </div>
            <PersonForm
              people={availablePeople}
              allowRelationships={false}
              restrictedGender={relatedGender}
              onSaved={(created) => {
                setAvailablePeople((prev) => [...prev, created]);
                if (relatedRole === "parent") setParentIds((prev) => [...prev, created.id]);
                if (relatedRole === "spouse") setSpouseIds((prev) => [...prev, created.id]);
                if (relatedRole === "child") setChildIds((prev) => [...prev, created.id]);
                setRelatedRole(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
