import type { Gender } from "./types";
import type { CSSProperties } from "react";

export const GENDER_COLOR: Record<Gender, string> = {
  female: "#e6a4c4",
  male: "#8fb8de",
  other: "#c9c2e8",
};

export function genderTagStyle(gender: Gender): CSSProperties {
  const color = GENDER_COLOR[gender];
  return {
    "--gender-pill-color": color,
    borderColor: "var(--gender-pill-color)",
    backgroundColor:
      "color-mix(in srgb, var(--gender-pill-color) var(--gender-pill-opacity), transparent)",
  };
}
