import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
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

  // هماهنگ‌سازی متای رنگ تم در مرورگر و PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const bgColor = isDark ? "#09090b" : "#f8fafc";
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", bgColor);
  }

  // هماهنگ‌سازی نوار وضعیت (Status Bar) بومی در موبایل (Android / iOS)
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("StatusBar")) {
    try {
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      if (Capacitor.getPlatform() === "android") {
        await StatusBar.setBackgroundColor({ color: bgColor });
      }
    } catch {}
  }
}
