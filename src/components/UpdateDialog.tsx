import {
  AppUpdater,
  fetchManifest,
  readChannel,
  updaterAvailable,
  type UpdateManifest,
  type InstalledInfo,
} from "@/native/updater.ts";
import { Download, RefreshCw, X, ShieldAlert } from "lucide-react";
import React, { useEffect, useState } from "react";

export const UpdateDialog: React.FC = () => {
  const [manifest, setManifest] = useState<UpdateManifest | null>(null);
  const [installed, setInstalled] = useState<InstalledInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!updaterAvailable) return;

    const check = async () => {
      try {
        const info = await AppUpdater.getInfo();
        setInstalled(info);
        const channel = readChannel();
        const update = await fetchManifest(channel);

        if (update.versionCode > info.versionCode) {
          setManifest(update);
          setIsOpen(true);
        }
      } catch {
        // Silently fail on routine background check
      }
    };

    // Check 2 seconds after startup
    const timer = setTimeout(check, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartUpdate = async () => {
    if (!manifest) return;
    setError(null);
    setIsDownloading(true);
    setProgress(0);

    try {
      const permission = await AppUpdater.canInstall();
      if (!permission.granted) {
        await AppUpdater.openInstallSettings();
      }

      const listener = await AppUpdater.addListener("downloadProgress", (event) => {
        setProgress(Math.round(event.progress * 100));
      });

      await AppUpdater.downloadAndInstall({ url: manifest.apkUrl });
      await listener.remove();
      setIsDownloading(false);
    } catch (err: any) {
      setIsDownloading(false);
      setError(err?.message || "خطا در دریافت فایل به‌روزرسانی");
    }
  };

  if (!isOpen || !manifest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-100 relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <button
          type="button"
          onClick={() => !isDownloading && setIsOpen(false)}
          disabled={isDownloading}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: "10s" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">نسخه جدید در دسترس است!</h3>
            <p className="text-xs text-zinc-400">
              نسخه فعلی: {installed?.versionName || "1.0"} ➔ نسخه جدید: {manifest.versionName}
            </p>
          </div>
        </div>

        {manifest.notes && (
          <div className="my-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-300 leading-relaxed max-h-32 overflow-y-auto">
            {manifest.notes}
          </div>
        )}

        {error && (
          <div className="my-3 p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-xs text-red-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {isDownloading ? (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>در حال دانلود بسته نصب...</span>
              <span className="font-mono text-amber-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartUpdate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود و نصب خودکار</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-colors cursor-pointer"
            >
              بعداً
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
