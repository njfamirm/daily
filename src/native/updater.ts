import { registerPlugin, Capacitor } from "@capacitor/core";

const RELEASES = "https://github.com/njfamirm/taskdrop/releases";

export type UpdateChannel = "stable" | "nightly";

const CHANNEL_KEY = "taskdrop.updateChannel";

function manifestUrl(channel: UpdateChannel): string {
  return channel === "nightly"
    ? `${RELEASES}/download/nightly/update.json`
    : `${RELEASES}/latest/download/update.json`;
}

export function readChannel(): UpdateChannel {
  try {
    return localStorage.getItem(CHANNEL_KEY) === "stable" ? "stable" : "nightly";
  } catch {
    return "nightly";
  }
}

export function writeChannel(channel: UpdateChannel): void {
  try {
    localStorage.setItem(CHANNEL_KEY, channel);
  } catch {}
}

export interface UpdateManifest {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  notes?: string;
  releasedAt?: string;
}

export interface InstalledInfo {
  versionCode: number;
  versionName: string;
  packageName: string;
}

export interface AppUpdaterPlugin {
  getInfo(): Promise<InstalledInfo>;
  fetchManifest(options: { url: string }): Promise<{ body: string }>;
  canInstall(): Promise<{ granted: boolean }>;
  openInstallSettings(): Promise<void>;
  downloadAndInstall(options: { url: string }): Promise<void>;
  addListener(
    event: "downloadProgress",
    handler: (event: { progress: number; bytes: number; total: number }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

export const AppUpdater = registerPlugin<AppUpdaterPlugin>("AppUpdater");

export const updaterAvailable = Capacitor.isNativePlatform();

export async function fetchManifest(channel: UpdateChannel): Promise<UpdateManifest> {
  const { body } = await AppUpdater.fetchManifest({ url: manifestUrl(channel) });
  const manifest = JSON.parse(body) as UpdateManifest;
  if (typeof manifest.versionCode !== "number" || !manifest.apkUrl) {
    throw new Error("Malformed update manifest");
  }
  return manifest;
}
