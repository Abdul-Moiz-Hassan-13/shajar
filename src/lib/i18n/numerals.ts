import type { Locale } from "./translations";

const URDU_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toUrduDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => URDU_DIGITS[Number(d)]);
}

export function localizeNumber(n: number | string, locale: Locale): string {
  return locale === "ur" ? toUrduDigits(n) : String(n);
}
