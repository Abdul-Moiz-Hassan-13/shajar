export type Gender = "male" | "female" | "other";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  photoUrl?: string;
  notes?: string;
  /** 0-2 ids of this person's parents. */
  parentIds: string[];
  /** ids of this person's spouses/partners. */
  spouseIds: string[];
}

export interface FamilyData {
  people: Person[];
}

export type PersonInput = Omit<Person, "id">;
