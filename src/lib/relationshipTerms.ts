import type { Gender } from "./types";
import type { Locale } from "./i18n/translations";

export type CousinDirection = "ancestor" | "descendant" | "same";

export interface RelationshipTerms {
  parent(g: Gender): string;
  child(g: Gender): string;
  sibling(g: Gender, half: boolean): string;
  grandparent(g: Gender, levelsAboveParent: number): string;
  grandchild(g: Gender, levelsBelowChild: number): string;
  auntUncle(g: Gender, level: number): string;
  nieceNephew(g: Gender, level: number): string;
  spouse(g: Gender): string;
  cousin(
    degree: number,
    removed: number,
    direction: CousinDirection,
    g: Gender,
  ): string;
  inLaw(key: string, g: Gender): string | undefined;
  samePerson: string;
  related: string;
}

function pick(gender: Gender, male: string, female: string, neutral: string): string {
  if (gender === "male") return male;
  if (gender === "female") return female;
  return neutral;
}

function ordinalEn(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function greatPrefixEn(n: number): string {
  return n > 0 ? "Great-".repeat(n) : "";
}

const en: RelationshipTerms = {
  parent: (g) => pick(g, "Father", "Mother", "Parent"),
  child: (g) => pick(g, "Son", "Daughter", "Child"),
  sibling: (g, half) =>
    half
      ? pick(g, "Half-brother", "Half-sister", "Half-sibling")
      : pick(g, "Brother", "Sister", "Sibling"),
  grandparent: (g, levels) => {
    const prefix = levels === 1 ? "Grand" : `${greatPrefixEn(levels - 1)}Grand`;
    return prefix + pick(g, "father", "mother", "parent");
  },
  grandchild: (g, levels) => {
    const prefix = levels === 1 ? "Grand" : `${greatPrefixEn(levels - 1)}Grand`;
    return prefix + pick(g, "son", "daughter", "child");
  },
  auntUncle: (g, level) => {
    const base = pick(g, "Uncle", "Aunt", "Aunt/Uncle");
    if (level === 1) return base;
    const prefix = level === 2 ? "Grand-" : `${greatPrefixEn(level - 2)}Grand-`;
    return prefix + base;
  },
  nieceNephew: (g, level) => {
    const base = pick(g, "Nephew", "Niece", "Niece/Nephew");
    if (level === 1) return base;
    const prefix = level === 2 ? "Grand-" : `${greatPrefixEn(level - 2)}Grand-`;
    return prefix + base;
  },
  spouse: (g) => pick(g, "Husband", "Wife", "Spouse"),
  cousin: (degree, removed, direction) => {
    const base = `${ordinalEn(degree)} cousin`;
    // English "child"/"grandchild" don't inflect for gender, unlike Urdu.
    if (removed === 0 || direction === "same") return base;
    function ancestorWord(n: number): string {
      if (n === 1) return "parent's";
      if (n === 2) return "grandparent's";
      return `${greatPrefixEn(n - 2)}grandparent's`;
    }
    function descendantWord(n: number): string {
      if (n === 1) return "child";
      if (n === 2) return "grandchild";
      return `${greatPrefixEn(n - 2)}grandchild`;
    }
    return direction === "ancestor"
      ? `${ancestorWord(removed)} ${base}`
      : `${base}'s ${descendantWord(removed)}`;
  },
  inLaw: (key, g) => {
    const map: Record<string, string> = {
      "up,spouse": pick(g, "Step-father", "Step-mother", "Step-parent"),
      "spouse,down": pick(g, "Step-son", "Step-daughter", "Step-child"),
      "spouse,up": pick(g, "Father-in-law", "Mother-in-law", "Parent-in-law"),
      "down,spouse": pick(g, "Son-in-law", "Daughter-in-law", "Child-in-law"),
      "up,down,spouse": pick(g, "Brother-in-law", "Sister-in-law", "Sibling-in-law"),
      "spouse,up,down": pick(g, "Brother-in-law", "Sister-in-law", "Sibling-in-law"),
      "spouse,down,down": pick(g, "Step-grandson", "Step-granddaughter", "Step-grandchild"),
    };
    return map[key];
  },
  samePerson: "Same person",
  related: "Related",
};

const URDU_ORDINALS = [
  "پہلا",
  "دوسرا",
  "تیسرا",
  "چوتھا",
  "پانچواں",
  "چھٹا",
  "ساتواں",
  "آٹھواں",
  "نواں",
  "دسواں",
];

function ordinalUr(n: number): string {
  return URDU_ORDINALS[n - 1] ?? `${n}واں`;
}

function greatPrefixUr(n: number): string {
  return n > 0 ? "پڑ".repeat(n) : "";
}

const ur: RelationshipTerms = {
  parent: (g) => pick(g, "والد", "والدہ", "والدین"),
  child: (g) => pick(g, "بیٹا", "بیٹی", "بچہ"),
  sibling: (g, half) =>
    half
      ? pick(g, "سوتیلا بھائی", "سوتیلی بہن", "سوتیلا بہن بھائی")
      : pick(g, "بھائی", "بہن", "بہن بھائی"),
  grandparent: (g, levels) => {
    const prefix = levels === 1 ? "" : greatPrefixUr(levels - 1);
    return prefix + pick(g, "دادا", "دادی", "دادا دادی");
  },
  grandchild: (g, levels) => {
    const prefix = levels === 1 ? "" : greatPrefixUr(levels - 1);
    return prefix + pick(g, "پوتا", "پوتی", "پوتا پوتی");
  },
  auntUncle: (g, level) => {
    const base = pick(g, "چچا", "خالہ", "چچا/خالہ");
    if (level === 1) return base;
    const prefix = level === 2 ? "پڑ-" : `${greatPrefixUr(level - 2)}پڑ-`;
    return prefix + base;
  },
  nieceNephew: (g, level) => {
    const base = pick(g, "بھتیجا", "بھتیجی", "بھتیجا/بھتیجی");
    if (level === 1) return base;
    const prefix = level === 2 ? "پڑ-" : `${greatPrefixUr(level - 2)}پڑ-`;
    return prefix + base;
  },
  spouse: (g) => pick(g, "شوہر", "بیوی", "شریک حیات"),
  cousin: (degree, removed, direction, g) => {
    const base = `${ordinalUr(degree)} کزن`;
    if (removed === 0 || direction === "same") return base;
    function ancestorWord(n: number): string {
      if (n === 1) return "والدین کا";
      if (n === 2) return "دادا دادی کا";
      return `${greatPrefixUr(n - 2)}دادا دادی کا`;
    }
    function descendantWord(n: number): string {
      if (n === 1) return pick(g, "بیٹا", "بیٹی", "بچہ");
      if (n === 2) return pick(g, "پوتا", "پوتی", "پوتا/پوتی");
      return `${greatPrefixUr(n - 2)}${pick(g, "پوتا", "پوتی", "پوتا/پوتی")}`;
    }
    if (direction === "ancestor") return `${ancestorWord(removed)} ${base}`;
    const possessive = g === "female" ? "کی" : "کا";
    return `${base} ${possessive} ${descendantWord(removed)}`;
  },
  inLaw: (key, g) => {
    const map: Record<string, string> = {
      "up,spouse": pick(g, "سوتیلا باپ", "سوتیلی ماں", "سوتیلے والدین"),
      "spouse,down": pick(g, "سوتیلا بیٹا", "سوتیلی بیٹی", "سوتیلا بچہ"),
      "spouse,up": pick(g, "سسر", "ساس", "سسرالی والدین"),
      "down,spouse": pick(g, "داماد", "بہو", "سسرالی بچہ"),
      "up,down,spouse": pick(g, "بہنوئی", "نند", "نسبتی بہن بھائی"),
      "spouse,up,down": pick(g, "بہنوئی", "نند", "نسبتی بہن بھائی"),
      "spouse,down,down": pick(g, "سوتیلا پوتا", "سوتیلی پوتی", "سوتیلا پوتا/پوتی"),
    };
    return map[key];
  },
  samePerson: "وہی شخص",
  related: "رشتہ دار",
};

export const relationshipTerms: Record<Locale, RelationshipTerms> = { en, ur };
