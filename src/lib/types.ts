export type Gender = "male" | "female" | "other";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  /** Urdu-script transliteration, shown when the app is in Urdu mode. */
  firstNameUr?: string;
  /** Urdu-script transliteration, shown when the app is in Urdu mode. */
  lastNameUr?: string;
  gender: Gender;
  isDeceased?: boolean;
  notes?: string;
  /** 0-2 ids of this person's parents. */
  parentIds: string[];
  /** Optional birth order among siblings (lower = older); used to order the tree left-to-right. */
  siblingOrder?: number;
  /** ids of this person's spouses/partners (current, widowed, or divorced). */
  spouseIds: string[];
  /** subset of spouseIds whose relationship with this person ended in divorce. */
  divorcedSpouseIds?: string[];
  /**
   * Tree-layout exception, set in the data file only. Normally a married
   * couple sits on the deeper of the two partners' generations, which drags
   * the shallower partner (and their siblings' row) down. With this set, this
   * person is instead lifted to their spouse's generation, even if that is the
   * same row as their own parents; the line from their parents then loops
   * under the parents and enters this person from below.
   */
  alignToSpouseGeneration?: boolean;
}

export interface FamilyData {
  people: Person[];
}

export type PersonInput = Omit<Person, "id">;
