import type { Gender } from "@/lib/types";
import { toUrduDigits } from "./numerals";

export type Locale = "en" | "ur";

/** Direct-case ordinal (as relationshipTerms.ts builds cousin labels) to its
 * oblique form, for the "X کے پہلے کزن ہے" sentence construction. */
const DIRECT_TO_OBLIQUE_ORDINAL: Record<string, string> = {
  "پہلا": "پہلے",
  "دوسرا": "دوسرے",
  "تیسرا": "تیسرے",
  "چوتھا": "چوتھے",
  "پانچواں": "پانچویں",
  "چھٹا": "چھٹے",
  "ساتواں": "ساتویں",
  "آٹھواں": "آٹھویں",
  "نواں": "نویں",
  "دسواں": "دسویں",
};

export interface TranslationDict {
  brand: string;
  nav: {
    home: string;
    people: string;
    tree: string;
    relations: string;
    families: string;
    menu: string;
  };
  languageToggle: {
    label: string;
  };
  themeToggle: {
    toDark: string;
    toLight: string;
  };
  home: {
    emptyTagline: string;
    plantSeed: string;
    welcomeBack: string;
    subtitle: (people: number, generations: number) => string;
    story: string;
    stories: string;
    generation: string;
    generations: string;
    statPeople: string;
    statGenerations: string;
    statCouples: string;
    statLiving: string;
    exploreTree: string;
    exploreTreeDesc: string;
    addSomeoneNew: string;
    addSomeoneNewDesc: string;
    oldestBranches: string;
  };
  people: {
    title: string;
    addPerson: string;
    searchPlaceholder: string;
    noOneYet: string;
    addFirstPerson: string;
    noMatches: (query: string) => string;
    colName: string;
    colDeceased: string;
    colParents: string;
    colSpouses: string;
    yes: string;
    edit: string;
  };
  tree: {
    title: string;
    nothingToShow: string;
    addSomeone: string;
    toGetStarted: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    exportImage: string;
    exporting: string;
  };
  relations: {
    title: string;
    subtitle: string;
    personA: string;
    personB: string;
    searchPlaceholder: string;
    toggleList: string;
    noMatches: string;
    findRelationship: string;
    pickTwoFirst: string;
    noConnection: string;
    relationshipLabel: string;
    isRelationOf: (
      nameB: string,
      nameA: string,
      label: string,
      genderB: Gender,
    ) => string;
    connectedVia: string;
    graph: string;
  };
  edgeLabels: {
    up: string;
    down: string;
    spouse: string;
    sibling: string;
  };
  form: {
    addPerson: string;
    editPerson: (name: string) => string;
    firstName: string;
    lastName: string;
    firstNameUr: string;
    lastNameUr: string;
    gender: string;
    male: string;
    female: string;
    other: string;
    deceased: string;
    photoUrl: string;
    notes: string;
    siblingOrder: string;
    siblingOrderPlaceholder: string;
    parents: string;
    searchPlaceholder: string;
    noOtherPeople: string;
    noMatches: string;
    spouses: string;
    divorced: string;
    save: string;
    saving: string;
    cancel: string;
    somethingWrong: string;
  };
  deletePerson: {
    confirm: (name: string) => string;
    deleting: string;
    delete: string;
  };
  families: {
    title: string;
    subtitle: string;
    noFamilies: string;
    childrenLabel: string;
    noChildren: string;
    unknownParent: string;
  };
}

const en: TranslationDict = {
  brand: "Shajar",
  nav: {
    home: "Home",
    people: "People",
    tree: "Tree",
    relations: "Relations",
    families: "Families",
    menu: "Menu",
  },
  languageToggle: {
    label: "اردو",
  },
  themeToggle: {
    toDark: "Switch to dark mode",
    toLight: "Switch to light mode",
  },
  home: {
    emptyTagline:
      "Every family tree starts with a single name. Plant yours and watch the branches grow.",
    plantSeed: "Plant the first seed 🌱",
    welcomeBack: "Welcome back",
    subtitle: (people, generations) =>
      `${people} ${people === 1 ? "story" : "stories"} across ${generations} ${
        generations === 1 ? "generation" : "generations"
      }, and counting.`,
    story: "story",
    stories: "stories",
    generation: "generation",
    generations: "generations",
    statPeople: "People",
    statGenerations: "Generations",
    statCouples: "Couples",
    statLiving: "Living",
    exploreTree: "Explore the tree",
    exploreTreeDesc: "See how everyone connects, generation by generation.",
    addSomeoneNew: "Add someone new",
    addSomeoneNewDesc: "Bring another relative into the tree.",
    oldestBranches: "The oldest branches",
  },
  people: {
    title: "People",
    addPerson: "Add a person",
    searchPlaceholder: "Search people…",
    noOneYet: "No one here yet.",
    addFirstPerson: "Add the first person",
    noMatches: (query) => `No one matches "${query}".`,
    colName: "Name",
    colDeceased: "Deceased",
    colParents: "Parents",
    colSpouses: "Spouses",
    yes: "Yes",
    edit: "Edit",
  },
  tree: {
    title: "Family tree",
    nothingToShow: "Nothing to show yet.",
    addSomeone: "Add someone",
    toGetStarted: "to get started.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: "Reset zoom",
    exportImage: "Export image",
    exporting: "Exporting…",
  },
  relations: {
    title: "How are they related?",
    subtitle:
      "Pick any two people to see their relationship and how they connect.",
    personA: "Person A",
    personB: "Person B",
    searchPlaceholder: "Search…",
    toggleList: "Toggle list",
    noMatches: "No matches.",
    findRelationship: "Find relationship",
    pickTwoFirst: "Pick two different people first.",
    noConnection: "No connection found between these two people in the tree.",
    relationshipLabel: "Relationship",
    isRelationOf: (nameB, nameA, label) => `${nameB} is ${nameA}'s ${label}`,
    connectedVia: "Connected via",
    graph: "Graph",
  },
  edgeLabels: {
    up: "parent",
    down: "child",
    spouse: "spouse",
    sibling: "sibling",
  },
  form: {
    addPerson: "Add a person",
    editPerson: (name) => `Edit ${name}`,
    firstName: "First name",
    lastName: "Last name (optional)",
    firstNameUr: "First name (Urdu, optional)",
    lastNameUr: "Last name (Urdu, optional)",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    deceased: "Deceased",
    photoUrl: "Photo URL",
    notes: "Notes",
    siblingOrder: "Birth order among siblings (optional)",
    siblingOrderPlaceholder: "1 = oldest, 2 = next, …",
    parents: "Parents (up to 2)",
    searchPlaceholder: "Search…",
    noOtherPeople: "No other people yet.",
    noMatches: "No matches.",
    spouses: "Spouses / partners",
    divorced: "Divorced",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    somethingWrong: "Something went wrong.",
  },
  deletePerson: {
    confirm: (name) => `Delete ${name}? This cannot be undone.`,
    deleting: "Deleting…",
    delete: "Delete",
  },
  families: {
    title: "Families",
    subtitle:
      "Every couple and their direct children.",
    noFamilies: "No families yet.",
    childrenLabel: "Children",
    noChildren: "No children on record.",
    unknownParent: "Unknown parent",
  },
};

const ur: TranslationDict = {
  brand: "شجر",
  nav: {
    home: "گھر",
    people: "لوگ",
    tree: "شجرہ",
    relations: "رشتے",
    families: "خاندان",
    menu: "مینو",
  },
  languageToggle: {
    label: "English",
  },
  themeToggle: {
    toDark: "ڈارک موڈ میں جائیں",
    toLight: "لائٹ موڈ میں جائیں",
  },
  home: {
    emptyTagline:
      "ہر خاندانی شجرہ ایک نام سے شروع ہوتا ہے۔ اپنا نام لگائیں اور شاخوں کو بڑھتے دیکھیں۔",
    plantSeed: "پہلا بیج لگائیں 🌱",
    welcomeBack: "خوش آمدید",
    subtitle: (people, generations) =>
      `${toUrduDigits(generations)} ${
        generations === 1 ? "نسل" : "نسلوں"
      } میں ${toUrduDigits(people)} ${people === 1 ? "کہانی" : "کہانیاں"}، اور سلسلہ جاری ہے۔`,
    story: "کہانی",
    stories: "کہانیاں",
    generation: "نسل",
    generations: "نسلیں",
    statPeople: "لوگ",
    statGenerations: "نسلیں",
    statCouples: "جوڑے",
    statLiving: "حیات",
    exploreTree: "شجرہ دیکھیں",
    exploreTreeDesc: "دیکھیں کہ سب لوگ نسل در نسل کیسے جڑے ہیں۔",
    addSomeoneNew: "نیا فرد شامل کریں",
    addSomeoneNewDesc: "شجرے میں ایک اور رشتہ دار شامل کریں۔",
    oldestBranches: "سب سے پرانی شاخیں",
  },
  people: {
    title: "لوگ",
    addPerson: "فرد شامل کریں",
    searchPlaceholder: "لوگ تلاش کریں…",
    noOneYet: "ابھی تک یہاں کوئی نہیں۔",
    addFirstPerson: "پہلا فرد شامل کریں",
    noMatches: (query) => `"${query}" سے کوئی میل نہیں کھاتا۔`,
    colName: "نام",
    colDeceased: "متوفی",
    colParents: "والدین",
    colSpouses: "شریک حیات",
    yes: "ہاں",
    edit: "ترمیم",
  },
  tree: {
    title: "شجرہ نسب",
    nothingToShow: "ابھی دکھانے کے لیے کچھ نہیں ہے۔",
    addSomeone: "کسی کو شامل کریں",
    toGetStarted: "شروع کرنے کے لیے۔",
    zoomIn: "زوم ان",
    zoomOut: "زوم آؤٹ",
    resetZoom: "زوم ری سیٹ کریں",
    exportImage: "تصویر ایکسپورٹ کریں",
    exporting: "ایکسپورٹ ہو رہا ہے…",
  },
  relations: {
    title: "ان کا آپس میں کیا رشتہ ہے؟",
    subtitle:
      "کوئی بھی دو افراد منتخب کریں تاکہ ان کا رشتہ اور تعلق دیکھا جا سکے۔",
    personA: "پہلا فرد",
    personB: "دوسرا فرد",
    searchPlaceholder: "تلاش کریں…",
    toggleList: "فہرست دکھائیں",
    noMatches: "کوئی میل نہیں ملا۔",
    findRelationship: "رشتہ معلوم کریں",
    pickTwoFirst: "پہلے دو مختلف افراد منتخب کریں۔",
    noConnection: "شجرے میں ان دونوں افراد کے درمیان کوئی تعلق نہیں ملا۔",
    relationshipLabel: "رشتہ",
    isRelationOf: (nameB, nameA, label, genderB) => {
      // "کزن" (cousin) doesn't inflect for gender. On its own ("first
      // cousin") it takes the plain "کا پہلا کزن". Only when something
      // trails it — "cousin's son/daughter" — does the construction switch
      // to the oblique "کے پہلے کزن کا بیٹا".
      if (/کزن$/.test(label.trim())) {
        return `${nameB}، ${nameA} کا ${label} ہے`;
      }
      if (label.includes("کزن")) {
        const obliqueLabel = label.replace(
          /^(پہلا|دوسرا|تیسرا|چوتھا|پانچواں|چھٹا|ساتواں|آٹھواں|نواں|دسواں)/,
          (direct) => DIRECT_TO_OBLIQUE_ORDINAL[direct] ?? direct,
        );
        return `${nameB}، ${nameA} کے ${obliqueLabel} ہے`;
      }
      const possessive = genderB === "female" ? "کی" : "کا";
      return `${nameB}، ${nameA} ${possessive} ${label} ہے`;
    },
    connectedVia: "تعلق کا ذریعہ",
    graph: "خاکہ",
  },
  edgeLabels: {
    up: "والدین",
    down: "اولاد",
    spouse: "شریک حیات",
    sibling: "بہن بھائی",
  },
  form: {
    addPerson: "فرد شامل کریں",
    editPerson: (name) => `${name} میں ترمیم کریں`,
    firstName: "پہلا نام",
    lastName: "آخری نام (اختیاری)",
    firstNameUr: "پہلا نام (اردو، اختیاری)",
    lastNameUr: "آخری نام (اردو، اختیاری)",
    gender: "جنس",
    male: "مرد",
    female: "عورت",
    other: "دیگر",
    deceased: "متوفی",
    photoUrl: "تصویر کا لنک",
    notes: "نوٹس",
    siblingOrder: "بہن بھائیوں میں پیدائشی ترتیب (اختیاری)",
    siblingOrderPlaceholder: "1 = سب سے بڑا، 2 = اس کے بعد، …",
    parents: "والدین (زیادہ سے زیادہ 2)",
    searchPlaceholder: "تلاش کریں…",
    noOtherPeople: "ابھی کوئی اور فرد موجود نہیں۔",
    noMatches: "کوئی میل نہیں ملا۔",
    spouses: "شریک حیات",
    divorced: "طلاق یافتہ",
    save: "محفوظ کریں",
    saving: "محفوظ ہو رہا ہے…",
    cancel: "منسوخ کریں",
    somethingWrong: "کچھ غلط ہو گیا۔",
  },
  deletePerson: {
    confirm: (name) => `${name} کو حذف کریں؟ یہ واپس نہیں ہو سکتا۔`,
    deleting: "حذف ہو رہا ہے…",
    delete: "حذف کریں",
  },
  families: {
    title: "خاندان",
    subtitle: "ہر جوڑا اور ان کی اولاد۔",
    noFamilies: "ابھی تک کوئی خاندان موجود نہیں۔",
    childrenLabel: "اولاد",
    noChildren: "کوئی اولاد درج نہیں۔",
    unknownParent: "نامعلوم والدین",
  },
};

export const translations: Record<Locale, TranslationDict> = { en, ur };
