export type Gender = "male" | "female" | "other";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  isDeceased?: boolean;
  photoUrl?: string;
  notes?: string;
  /** 0-2 ids of this person's parents. */
  parentIds: string[];
  /** Optional birth order among siblings (lower = older); used to order the tree left-to-right. */
  siblingOrder?: number;
  /** ids of this person's spouses/partners (current, widowed, or divorced). */
  spouseIds: string[];
  /** subset of spouseIds whose relationship with this person ended in divorce. */
  divorcedSpouseIds?: string[];
}

export interface FamilyData {
  people: Person[];
}

export type PersonInput = Omit<Person, "id">;
