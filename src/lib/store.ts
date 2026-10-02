import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { FamilyData, Person, PersonInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "family.json");

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const empty: FamilyData = { people: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2), "utf-8");
  }
}

async function readData(): Promise<FamilyData> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as FamilyData;
}

async function writeData(data: FamilyData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getAllPeople(): Promise<Person[]> {
  const data = await readData();
  return data.people;
}

export async function getPerson(id: string): Promise<Person | undefined> {
  const data = await readData();
  return data.people.find((p) => p.id === id);
}

function removeBacklinks(data: FamilyData, id: string): void {
  for (const person of data.people) {
    person.parentIds = person.parentIds.filter((pid) => pid !== id);
    person.spouseIds = person.spouseIds.filter((sid) => sid !== id);
    person.divorcedSpouseIds = (person.divorcedSpouseIds ?? []).filter(
      (sid) => sid !== id,
    );
  }
}

function syncRelations(data: FamilyData, person: Person): void {
  // Keep spouse links symmetric.
  for (const other of data.people) {
    if (other.id === person.id) continue;
    const shouldBeSpouse = person.spouseIds.includes(other.id);
    const isSpouse = other.spouseIds.includes(person.id);
    if (shouldBeSpouse && !isSpouse) other.spouseIds.push(person.id);
    if (!shouldBeSpouse && isSpouse) {
      other.spouseIds = other.spouseIds.filter((id) => id !== person.id);
    }

    // Keep divorce status symmetric too (and only meaningful between actual
    // spouses).
    const divorced = person.divorcedSpouseIds ?? [];
    const otherDivorced = other.divorcedSpouseIds ?? [];
    const shouldBeDivorced = shouldBeSpouse && divorced.includes(other.id);
    const isDivorced = otherDivorced.includes(person.id);
    if (shouldBeDivorced && !isDivorced) {
      other.divorcedSpouseIds = [...otherDivorced, person.id];
    }
    if (!shouldBeDivorced && isDivorced) {
      other.divorcedSpouseIds = otherDivorced.filter(
        (id) => id !== person.id,
      );
    }
  }
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const data = await readData();
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
  data.people.push(person);
  syncRelations(data, person);
  await writeData(data);
  return person;
}

export async function updatePerson(
  id: string,
  input: PersonInput,
): Promise<Person | undefined> {
  const data = await readData();
  const existing = data.people.find((p) => p.id === id);
  if (!existing) return undefined;

  existing.firstName = input.firstName;
  existing.lastName = input.lastName;
  existing.firstNameUr = input.firstNameUr;
  existing.lastNameUr = input.lastNameUr;
  existing.gender = input.gender;
  existing.isDeceased = input.isDeceased;
  existing.notes = input.notes;
  existing.parentIds = input.parentIds ?? [];
  existing.spouseIds = input.spouseIds ?? [];
  existing.divorcedSpouseIds = input.divorcedSpouseIds ?? [];
  existing.siblingOrder = input.siblingOrder;

  syncRelations(data, existing);
  await writeData(data);
  return existing;
}

export async function renamePerson(
  id: string,
  names: Pick<Person, "firstName" | "lastName">,
): Promise<Person | undefined> {
  const data = await readData();
  const existing = data.people.find((p) => p.id === id);
  if (!existing) return undefined;

  existing.firstName = names.firstName;
  existing.lastName = names.lastName;
  await writeData(data);
  return existing;
}

export async function deletePerson(id: string): Promise<boolean> {
  const data = await readData();
  const before = data.people.length;
  data.people = data.people.filter((p) => p.id !== id);
  if (data.people.length === before) return false;
  removeBacklinks(data, id);
  await writeData(data);
  return true;
}
