import type { PrimaryColor, ThemeMode } from "@/lib/types.ts";

export interface ColorPreset {
  id: PrimaryColor;
  label: string;
  bgHex: string;
  dotClass: string;
  ringClass: string;
  textClass: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "yellow",
    label: "زرد قناری",
    bgHex: "#eab308",
    dotClass: "bg-amber-400",
    ringClass: "ring-amber-400",
    textClass: "text-amber-400",
  },
  {
    id: "emerald",
    label: "سبز زمردی",
    bgHex: "#10b981",
    dotClass: "bg-emerald-400",
    ringClass: "ring-emerald-400",
    textClass: "text-emerald-400",
  },
  {
    id: "violet",
    label: "بنفش",
    bgHex: "#8b5cf6",
    dotClass: "bg-violet-400",
    ringClass: "ring-violet-400",
    textClass: "text-violet-400",
  },
  {
    id: "blue",
    label: "آبی",
    bgHex: "#3b82f6",
    dotClass: "bg-blue-400",
    ringClass: "ring-blue-400",
    textClass: "text-blue-400",
  },
  {
    id: "rose",
    label: "رز",
    bgHex: "#f43f5e",
    dotClass: "bg-rose-400",
    ringClass: "ring-rose-400",
    textClass: "text-rose-400",
  },
  {
    id: "orange",
    label: "نارنجی",
    bgHex: "#f97316",
    dotClass: "bg-orange-400",
    ringClass: "ring-orange-400",
    textClass: "text-orange-400",
  },
];

export function applyTheme(theme: ThemeMode = "dark", color: PrimaryColor = "yellow") {
  const root = document.documentElement;

  let resolved = theme;
  if (theme === "auto") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-color", color);
}
