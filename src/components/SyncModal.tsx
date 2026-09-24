import { Button } from "@/components/ui/button.tsx";
import {
  loadSyncConfig,
  pullFromVault,
  pushToVault,
  saveSyncConfig,
  type SyncConfig,
} from "@/lib/cloudSync.ts";
import { mergeDBs } from "@/lib/syncEngine.ts";
import type { DB } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { Check, Cloud, HelpCircle, KeyRound, Lock, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  db: DB;
  onSyncApply: (newDb: DB) => void;
  onClose: () => void;
  onMessage: (msg: string) => void;
}

export function SyncModal({ open, db, onSyncApply, onClose, onMessage }: Props) {
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(loadSyncConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverStatus, setServerStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // بستن مدال با Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // تست ارتباط با سرور شخصی
  const handleTestServer = async () => {
    if (!syncConfig.serverUrl.trim()) {
      setServerStatus("error");
      setStatusMessage("لطفاً آدرس سرور را وارد کنید");
      return;
    }
    setServerStatus("testing");
    setStatusMessage("در حال بررسی سلامت سرور…");

    try {
      const cleanUrl = syncConfig.serverUrl.replace(/\/+$/, "");
      const headers: Record<string, string> = {};
      if (syncConfig.authToken?.trim()) {
        headers["Authorization"] = `Bearer ${syncConfig.authToken.trim()}`;
      }
      const res = await fetch(`${cleanUrl}/health`, { headers });
      if (res.ok) {
        setServerStatus("ok");
        setStatusMessage("ارتباط با سرور برقرار و معتبر است");
      } else if (res.status === 401) {
        setServerStatus("error");
        setStatusMessage("توکن امنیتی سرور نامعتبر است (401)");
      } else {
        setServerStatus("error");
        setStatusMessage(`پاسخ ناموفق از سرور (${res.status})`);
      }
    } catch (err) {
      setServerStatus("error");
      setStatusMessage(`عدم دسترسی به سرور: ${err instanceof Error ? err.message : "خطای شبکه"}`);
    }
  };

  // همگام‌سازی ابری دوطرفه (Pull -> Merge -> Push)
  const handleCloudSync = async () => {
    if (
      !syncConfig.serverUrl.trim() ||
      !syncConfig.vaultId.trim() ||
      !syncConfig.secretKey.trim()
    ) {
      onMessage("لطفاً آدرس سرور، کد والت و رمز اختصاصی را کامل کنید");
      return;
    }

    setIsSyncing(true);
    try {
      saveSyncConfig(syncConfig);

      // ۱. پول کردن از والت سرور
      const remote = await pullFromVault(
        syncConfig.serverUrl,
        syncConfig.vaultId,
        syncConfig.secretKey,
        syncConfig.authToken,
      );

      let finalDb = db;
      if (remote) {
        // ۲. ادغام بدون تداخل
        finalDb = mergeDBs(db, remote.db);
        onSyncApply(finalDb);
      }

      // ۳. پوش نسخه نهایی
      await pushToVault(
        syncConfig.serverUrl,
        syncConfig.vaultId,
        syncConfig.secretKey,
        finalDb,
        syncConfig.authToken,
      );

      const now = Date.now();
      const updatedConfig = { ...syncConfig, lastSyncedAt: now, enabled: true };
      setSyncConfig(updatedConfig);
      saveSyncConfig(updatedConfig);

      onMessage("همگام‌سازی سرور با موفقیت انجام شد");
    } catch (err) {
      onMessage(`خطا در همگام‌سازی: ${err instanceof Error ? err.message : "خطای ناشناخته"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // تولید کد والت رندوم
  const handleGenerateVaultId = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "TASK-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const next = { ...syncConfig, vaultId: code };
    setSyncConfig(next);
    saveSyncConfig(next);
    onMessage(`کد والت جدید ساخته شد: ${code}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مدال */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-sky-950/80 border border-sky-800/60 text-sky-400">
              <Cloud className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">همگام‌سازی سرور شخصی (E2EE)</h2>
              <p className="text-[11px] text-zinc-400">
                سینک ایمن دوطرفه با رمزنگاری سرتاسری ۲۵۶ بیتی روی دستگاه شما
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="بستن" onClick={onClose}>
            <X />
          </Button>
        </div>

        {/* فرم تنظیمات سرور شخصی */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 space-y-3">
            {/* آدرس سرور */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-zinc-300">
                آدرس سرور رله (Server URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://taskdrop-sync-relay.YOUR_NAME.workers.dev"
                  value={syncConfig.serverUrl}
                  onChange={(e) => {
                    const next = { ...syncConfig, serverUrl: e.target.value };
                    setSyncConfig(next);
                    saveSyncConfig(next);
                    setServerStatus("idle");
                  }}
                  className="flex-1 rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 font-mono outline-none focus:border-sky-500"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestServer}
                  disabled={serverStatus === "testing"}
                  className="border-zinc-700 bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  {serverStatus === "testing" ? (
                    <RefreshCw className="size-3 animate-spin" />
                  ) : serverStatus === "ok" ? (
                    <Check className="size-3 text-emerald-400" />
                  ) : (
                    "تست سرور"
                  )}
                </Button>
              </div>
              {statusMessage && (
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    serverStatus === "ok" ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  {statusMessage}
                </p>
              )}
            </div>

            {/* توکن امنیتی سرور (اختیاری برای سرورهای محافظت شده) */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-zinc-300">
                توکن امنیتی سرور (Server Auth Token):
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="در صورت فعال بودن AUTH_TOKEN روی ورکر"
                  value={syncConfig.authToken || ""}
                  onChange={(e) => {
                    const next = { ...syncConfig, authToken: e.target.value };
                    setSyncConfig(next);
                    saveSyncConfig(next);
                  }}
                  className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 font-mono outline-none focus:border-sky-500"
                />
                <ShieldCheck className="absolute end-2.5 top-2 size-3.5 text-zinc-500" />
              </div>
            </div>

            {/* کد والت (شناسه صندوق) */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-zinc-300">
                <span>کد والت (Sync Vault ID):</span>
                <button
                  type="button"
                  onClick={handleGenerateVaultId}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  تولید کد جدید
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="TASK-XXXXXX"
                  value={syncConfig.vaultId}
                  onChange={(e) => {
                    const next = { ...syncConfig, vaultId: e.target.value.toUpperCase() };
                    setSyncConfig(next);
                    saveSyncConfig(next);
                  }}
                  className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 font-mono outline-none uppercase focus:border-sky-500"
                />
                <KeyRound className="absolute end-2.5 top-2 size-3.5 text-zinc-500" />
              </div>
            </div>

            {/* رمز اختصاصی رمزنگاری */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-zinc-300">
                رمز اختصاصی رمزنگاری (End-to-End Encryption Key):
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="کلمه عبور امن برای رمزنگاری دیتای شما"
                  value={syncConfig.secretKey}
                  onChange={(e) => {
                    const next = { ...syncConfig, secretKey: e.target.value };
                    setSyncConfig(next);
                    saveSyncConfig(next);
                  }}
                  className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 font-mono outline-none focus:border-sky-500"
                />
                <Lock className="absolute end-2.5 top-2 size-3.5 text-zinc-500" />
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                دیتا با استاندارد AES-GCM روی مرورگر شما رمز می‌شود؛ حتی سرور هم به محتوای خام دسترسی
                ندارد.
              </p>
            </div>

            {/* دکمه همگام‌سازی فوری */}
            <Button
              onClick={handleCloudSync}
              disabled={isSyncing}
              className="w-full gap-2 bg-sky-600 text-white hover:bg-sky-500 font-semibold text-xs mt-2"
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "در حال همگام‌سازی و ادغام…" : "همگام‌سازی فوری (Sync Now)"}</span>
            </Button>
          </div>

          {syncConfig.lastSyncedAt && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span>آخرین همگام‌سازی موفق:</span>
              <span className="font-mono text-zinc-300">
                {new Date(syncConfig.lastSyncedAt).toLocaleTimeString("fa-IR")}
              </span>
            </div>
          )}
        </div>

        {/* فوتر مدال */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <HelpCircle className="size-3.5 text-zinc-400" />
            <span>ادغام خودکار و بدون تداخل (Conflict-Free)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            بستن
          </Button>
        </div>
      </div>
    </div>
  );
}
