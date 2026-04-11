import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind CSSクラス名を安全に結合するユーティリティ */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
