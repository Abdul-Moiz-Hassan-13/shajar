import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { Person, PersonInput } from "./types";

type PersonRow = {
  id: string;
  first_name: string;
  last_name: string;
  first_name_ur: string | null;
  last_name_ur: string | null;
  gender: Person["gender"];
  is_deceased: boolean;
  notes: string | null;
  parent_ids: string[];
  spouse_ids: string[];
  divorced_spouse_ids: string[];
  sibling_order: number | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

function client(forWrite = false): SupabaseClient {
  const key = forWrite ? secretKey : publishableKey;
  if (!supabaseUrl || !key) {
    throw new Error(
      forWrite
        ? "Supabase write credentials are not configured. Set SUPABASE_SECRET_KEY."
        : "Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createClient(supabaseUrl, key, { auth: { persistSession: false } });
}

function fromRow(row: PersonRow): Person {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    firstNameUr: row.first_name_ur ?? undefined,
    lastNameUr: row.last_name_ur ?? undefined,
    gender: row.gender,
    isDeceased: row.is_deceased,
    notes: row.notes ?? undefined,
    parentIds: row.parent_ids ?? [],
    spouseIds: row.spouse_ids ?? [],
    divorcedSpouseIds: row.divorced_spouse_ids ?? [],
    siblingOrder: row.sibling_order ?? undefined,
  };
}

function toRow(person: Person): PersonRow {
  return {
    id: person.id,
    first_name: person.firstName,
    last_name: person.lastName,
    first_name_ur: person.firstNameUr ?? null,
    last_name_ur: person.lastNameUr ?? null,
    gender: person.gender,
    is_deceased: person.isDeceased ?? false,
    notes: person.notes ?? null,
    parent_ids: person.parentIds ?? [],
    spouse_ids: person.spouseIds ?? [],
    divorced_spouse_ids: person.divorcedSpouseIds ?? [],
    sibling_order: person.siblingOrder ?? null,
  };
}

async function readPeople(): Promise<Person[]> {
  const { data, error } = await client().from("people").select("*").order("first_name");
  if (error) throw new Error(`Unable to load people: ${error.message}`);
  return (data as PersonRow[]).map(fromRow);
}

async function writePeople(people: Person[]): Promise<void> {
  const { error } = await client(true).from("people").upsert(people.map(toRow), { onConflict: "id" });
  if (error) throw new Error(`Unable to save people: ${error.message}`);
}

export async function getAllPeople(): Promise<Person[]> {
  return readPeople();
}

export async function getPerson(id: string): Promise<Person | undefined> {
  const { data, error } = await client().from("people").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Unable to load person: ${error.message}`);
  return data ? fromRow(data as PersonRow) : undefined;
}

function removeBacklinks(people: Person[], id: string): void {
  for (const person of people) {
    person.parentIds = person.parentIds.filter((pid) => pid !== id);
    person.spouseIds = person.spouseIds.filter((sid) => sid !== id);
    person.divorcedSpouseIds = (person.divorcedSpouseIds ?? []).filter((sid) => sid !== id);
  }
}

function syncRelations(people: Person[], person: Person): void {
  for (const other of people) {
    if (other.id === person.id) continue;
    const shouldBeSpouse = person.spouseIds.includes(other.id);
    const isSpouse = other.spouseIds.includes(person.id);
    if (shouldBeSpouse && !isSpouse) other.spouseIds.push(person.id);
    if (!shouldBeSpouse && isSpouse) other.spouseIds = other.spouseIds.filter((id) => id !== person.id);

    const divorced = person.divorcedSpouseIds ?? [];
    const otherDivorced = other.divorcedSpouseIds ?? [];
    const shouldBeDivorced = shouldBeSpouse && divorced.includes(other.id);
    const isDivorced = otherDivorced.includes(person.id);
    if (shouldBeDivorced && !isDivorced) other.divorcedSpouseIds = [...otherDivorced, person.id];
    if (!shouldBeDivorced && isDivorced) other.divorcedSpouseIds = otherDivorced.filter((id) => id !== person.id);
  }
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const people = await readPeople();
  const person: Person = {
    id: randomUUID(),
    firstName: input.firstName,
    lastName: input.lastName,
    firstNameUr: input.firstNameUr,
    lastNameUr: input.lastNameUr,
    gender: input.gender,
    isDeceased: input.isDeceased,
    notes: input.notes,
    parentIds: input.parentIds ?? [],
    spouseIds: input.spouseIds ?? [],
    divorcedSpouseIds: input.divorcedSpouseIds ?? [],
    siblingOrder: input.siblingOrder,
  };
  people.push(person);
  syncRelations(people, person);
  await writePeople(people);
  return person;
}

export async function updatePerson(id: string, input: PersonInput): Promise<Person | undefined> {
  const people = await readPeople();
  const existing = people.find((person) => person.id === id);
  if (!existing) return undefined;
  Object.assign(existing, {
    firstName: input.firstName,
    lastName: input.lastName,
    firstNameUr: input.firstNameUr,
    lastNameUr: input.lastNameUr,
    gender: input.gender,
    isDeceased: input.isDeceased,
    notes: input.notes,
    parentIds: input.parentIds ?? [],
    spouseIds: input.spouseIds ?? [],
    divorcedSpouseIds: input.divorcedSpouseIds ?? [],
    siblingOrder: input.siblingOrder,
  });
  syncRelations(people, existing);
  await writePeople(people);
  return existing;
}

export async function renamePerson(id: string, names: Pick<Person, "firstName" | "lastName">): Promise<Person | undefined> {
  const people = await readPeople();
  const existing = people.find((person) => person.id === id);
  if (!existing) return undefined;
  existing.firstName = names.firstName;
  existing.lastName = names.lastName;
  await writePeople(people);
  return existing;
}

export async function deletePerson(id: string): Promise<boolean> {
  const people = await readPeople();
  const remaining = people.filter((person) => person.id !== id);
  if (remaining.length === people.length) return false;
  removeBacklinks(remaining, id);
  const { error } = await client(true).from("people").delete().eq("id", id);
  if (error) throw new Error(`Unable to delete person: ${error.message}`);
  await writePeople(remaining);
  return true;
}
