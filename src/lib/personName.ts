import type { Locale } from "./i18n/translations";
import type { Person } from "./types";

export function displayFirstName(p: Person, locale: Locale): string {
  return locale === "ur" && p.firstNameUr ? p.firstNameUr : p.firstName;
}

export function displayLastName(p: Person, locale: Locale): string {
  return locale === "ur" && p.lastNameUr ? p.lastNameUr : p.lastName;
}

export function displayFullName(p: Person, locale: Locale): string {
  return `${displayFirstName(p, locale)} ${displayLastName(p, locale)}`.trim();
}
