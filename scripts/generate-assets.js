import { execSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const RES_DIR = resolve("android/app/src/main/res");
const SRC_ICON = resolve("public/icons/icon-512.png");

const iconSizes = [
  { dir: "mipmap-mdpi", launcher: 48, foreground: 108 },
  { dir: "mipmap-hdpi", launcher: 72, foreground: 162 },
  { dir: "mipmap-xhdpi", launcher: 96, foreground: 216 },
  { dir: "mipmap-xxhdpi", launcher: 144, foreground: 324 },
  { dir: "mipmap-xxxhdpi", launcher: 192, foreground: 432 },
];

for (const { dir, launcher, foreground } of iconSizes) {
  const targetDir = resolve(RES_DIR, dir);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

  const launcherPath = resolve(targetDir, "ic_launcher.png");
  const roundPath = resolve(targetDir, "ic_launcher_round.png");
  const foregroundPath = resolve(targetDir, "ic_launcher_foreground.png");

  copyFileSync(SRC_ICON, launcherPath);
  execSync(`sips -z ${launcher} ${launcher} "${launcherPath}"`);

  copyFileSync(SRC_ICON, roundPath);
  execSync(`sips -z ${launcher} ${launcher} "${roundPath}"`);

  copyFileSync(SRC_ICON, foregroundPath);
  execSync(`sips -z ${foreground} ${foreground} "${foregroundPath}"`);
}

// Splash screens
const splashDirs = [
  "drawable",
  "drawable-port-mdpi",
  "drawable-port-hdpi",
  "drawable-port-xhdpi",
  "drawable-port-xxhdpi",
  "drawable-port-xxxhdpi",
  "drawable-land-mdpi",
  "drawable-land-hdpi",
  "drawable-land-xhdpi",
  "drawable-land-xxhdpi",
  "drawable-land-xxxhdpi",
];

for (const dir of splashDirs) {
  const targetDir = resolve(RES_DIR, dir);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  const splashPath = resolve(targetDir, "splash.png");
  copyFileSync(SRC_ICON, splashPath);
}

// Notification icon
const drawableDir = resolve(RES_DIR, "drawable");
copyFileSync(SRC_ICON, resolve(drawableDir, "ic_stat_icon_config_sample.png"));
execSync(`sips -z 96 96 "${resolve(drawableDir, "ic_stat_icon_config_sample.png")}"`);

console.log(
  "✅ All Android launcher and notification icons generated successfully from custom TaskDrop icon!",
);
