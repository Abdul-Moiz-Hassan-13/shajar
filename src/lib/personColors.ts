import type { Gender } from "./types";

export const GENDER_COLOR: Record<Gender, string> = {
  female: "#e6a4c4",
  male: "#8fb8de",
  other: "#c9c2e8",
};

export function genderTagStyle(gender: Gender) {
  const color = GENDER_COLOR[gender];
  return {
    borderColor: color,
    backgroundColor: `${color}26`,
  };
}
