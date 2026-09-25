import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import type { ThemeMode } from "@/lib/types.ts";

/** Apply active theme mode (dark/light/auto) to DOM and native status bar */
export async function applyTheme(theme: ThemeMode = "dark") {
  const root = document.documentElement;

  let resolved = theme;
  if (theme === "auto") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  const isDark = resolved === "dark";
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-color", "yellow");

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
