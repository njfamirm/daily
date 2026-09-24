import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import type { Language, PrimaryColor, ThemeMode } from "@/lib/types.ts";

export interface ColorPreset {
  id: PrimaryColor;
  labelFa: string;
  labelEn: string;
  bgHex: string;
  dotClass: string;
  ringClass: string;
  textClass: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "yellow",
    labelFa: "زرد قناری",
    labelEn: "Canary Yellow",
    bgHex: "#eab308",
    dotClass: "bg-amber-400",
    ringClass: "ring-amber-400",
    textClass: "text-amber-400",
  },
  {
    id: "emerald",
    labelFa: "سبز زمردی",
    labelEn: "Emerald Green",
    bgHex: "#10b981",
    dotClass: "bg-emerald-400",
    ringClass: "ring-emerald-400",
    textClass: "text-emerald-400",
  },
  {
    id: "violet",
    labelFa: "بنفش",
    labelEn: "Royal Violet",
    bgHex: "#8b5cf6",
    dotClass: "bg-violet-400",
    ringClass: "ring-violet-400",
    textClass: "text-violet-400",
  },
  {
    id: "blue",
    labelFa: "آبی",
    labelEn: "Electric Blue",
    bgHex: "#3b82f6",
    dotClass: "bg-blue-400",
    ringClass: "ring-blue-400",
    textClass: "text-blue-400",
  },
  {
    id: "rose",
    labelFa: "رز",
    labelEn: "Rose Pink",
    bgHex: "#f43f5e",
    dotClass: "bg-rose-400",
    ringClass: "ring-rose-400",
    textClass: "text-rose-400",
  },
  {
    id: "orange",
    labelFa: "نارنجی",
    labelEn: "Sunset Orange",
    bgHex: "#f97316",
    dotClass: "bg-orange-400",
    ringClass: "ring-orange-400",
    textClass: "text-orange-400",
  },
];

export function getColorLabel(preset: ColorPreset, lang: Language = "fa"): string {
  return lang === "fa" ? preset.labelFa : preset.labelEn;
}

/** Apply active theme mode (dark/light/auto) and primary accent color to DOM and status bar */
export async function applyTheme(theme: ThemeMode = "dark", color: PrimaryColor = "yellow") {
  const root = document.documentElement;

  let resolved = theme;
  if (theme === "auto") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  const isDark = resolved === "dark";
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-color", color);

  // Synchronize browser and PWA meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const bgColor = isDark ? "#09090b" : "#f8fafc";
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", bgColor);
  }

  // Synchronize native mobile status bar on Android/iOS
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("StatusBar")) {
    try {
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      if (Capacitor.getPlatform() === "android") {
        await StatusBar.setBackgroundColor({ color: bgColor });
      }
    } catch {}
  }
}
