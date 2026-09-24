import { Button } from "@/components/ui/button.tsx";
import {
  decodeSyncPairingToken,
  encodeSyncPairingToken,
  loadSyncConfig,
  pullFromVault,
  pushToVault,
  saveSyncConfig,
  type SyncConfig,
} from "@/lib/cloudSync.ts";
import { mergeDBs } from "@/lib/syncEngine.ts";
import type { DB } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import {
  Check,
  ClipboardCopy,
  Cloud,
  HelpCircle,
  KeyRound,
  Lock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import QRCode from "qrcode";
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

  // مدال و بارکد اتصال سریع
  const [showPairQr, setShowPairQr] = useState(false);
  const [pairingQrUrl, setPairingQrUrl] = useState<string>("");
  const [pastePairToken, setPastePairToken] = useState("");
  const [isPairCopied, setIsPairCopied] = useState(false);

  // تولید QR Code جفت‌سازی بر اساس کانفیگ فعلی
  useEffect(() => {
    if (!open || !showPairQr) return;
    if (
      !syncConfig.serverUrl.trim() ||
      !syncConfig.vaultId.trim() ||
      !syncConfig.secretKey.trim()
    ) {
      setPairingQrUrl("");
      return;
    }

    try {
      const token = encodeSyncPairingToken(syncConfig);
      void QRCode.toDataURL(token, {
        margin: 1,
        width: 260,
        errorCorrectionLevel: "M",
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }).then(setPairingQrUrl);
    } catch {
      setPairingQrUrl("");
    }
  }, [open, showPairQr, syncConfig]);

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
  const handleCloudSync = async (overrideCfg?: SyncConfig) => {
    const cfg = overrideCfg || syncConfig;
    if (!cfg.serverUrl.trim() || !cfg.vaultId.trim() || !cfg.secretKey.trim()) {
      onMessage("لطفاً آدرس سرور، کد والت و رمز اختصاصی را کامل کنید");
      return;
    }

    setIsSyncing(true);
    try {
      saveSyncConfig(cfg);

      // ۱. پول کردن از والت سرور
      const remote = await pullFromVault(cfg.serverUrl, cfg.vaultId, cfg.secretKey, cfg.authToken);

      let finalDb = db;
      if (remote) {
        // ۲. ادغام بدون تداخل
        finalDb = mergeDBs(db, remote.db);
        onSyncApply(finalDb);
      }

      // ۳. پوش نسخه نهایی
      await pushToVault(cfg.serverUrl, cfg.vaultId, cfg.secretKey, finalDb, cfg.authToken);

      const now = Date.now();
      const updatedConfig = { ...cfg, lastSyncedAt: now, enabled: true };
      setSyncConfig(updatedConfig);
      saveSyncConfig(updatedConfig);

      onMessage("همگام‌سازی سرور با موفقیت انجام شد");
    } catch (err) {
      onMessage(`خطا در همگام‌سازی: ${err instanceof Error ? err.message : "خطای ناشناخته"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // اعمال توکن جفت‌سازی (Pairing Token) وارد شده از دستگاه دیگر
  const handleApplyPairToken = () => {
    if (!pastePairToken.trim()) return;
    try {
      const parsed = decodeSyncPairingToken(pastePairToken);
      const next: SyncConfig = {
        ...syncConfig,
        ...parsed,
        enabled: true,
      };
      setSyncConfig(next);
      saveSyncConfig(next);
      setPastePairToken("");
      onMessage("تنظیمات اتصال از بارکد/توکن بازخوانی شد؛ در حال همگام‌سازی…");
      void handleCloudSync(next);
    } catch {
      onMessage("کد اتصال نامعتبر است");
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

  const isConfigReady =
    Boolean(syncConfig.serverUrl.trim()) &&
    Boolean(syncConfig.vaultId.trim()) &&
    Boolean(syncConfig.secretKey.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs"
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
              <h2 className="text-base font-semibold text-zinc-100">
                همگام‌سازی ابری TaskDrop (E2EE)
              </h2>
              <p className="text-[11px] text-zinc-400">
                سینک ایمن دوطرفه با رمزنگاری سرتاسری ۲۵۶ بیتی روی دستگاه شما
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="بستن" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="space-y-4">
          {/* کارت اتصال سریع (اسکن QR یا پیست کلید اتصال) */}
          <div className="rounded-xl border border-sky-900/50 bg-sky-950/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                <Sparkles className="size-3.5 text-sky-400" />
                اتصال سریع بین دستگاه‌ها
              </span>
              <button
                type="button"
                onClick={() => setShowPairQr((p) => !p)}
                disabled={!isConfigReady}
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-colors cursor-pointer",
                  isConfigReady
                    ? "bg-sky-900/40 text-sky-300 border-sky-700/60 hover:bg-sky-800/50"
                    : "text-zinc-600 border-zinc-800 cursor-not-allowed",
                )}
              >
                <QrCode className="size-3" />
                <span>{showPairQr ? "بستن بارکد" : "نمایش بارکد اتصال سریع"}</span>
              </button>
            </div>

            {/* بخش نمایش بارکد اتصال سریع */}
            {showPairQr && isConfigReady && (
              <div className="my-3 flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                {pairingQrUrl ? (
                  <div className="overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
                    <img src={pairingQrUrl} alt="Pairing QR" className="size-44 sm:size-48" />
                  </div>
                ) : (
                  <div className="py-8 text-xs text-zinc-500">در حال تولید بارکد…</div>
                )}
                <p className="mt-2 text-center text-[11px] text-zinc-300">
                  این بارکد را با دوربین گوشی یا دستگاه دوم اسکن کنید تا تمام اطلاعات و رمز خودکار
                  وارد شود.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const token = encodeSyncPairingToken(syncConfig);
                    await navigator.clipboard.writeText(token);
                    setIsPairCopied(true);
                    onMessage("کلید جفت‌سازی کپی شد");
                    setTimeout(() => setIsPairCopied(false), 2000);
                  }}
                  className="mt-2 flex items-center gap-1 text-xs text-sky-400 hover:underline cursor-pointer"
                >
                  <ClipboardCopy className="size-3" />
                  <span>
                    {isPairCopied ? "کپی شد!" : "کپی رشته اتصال برای پیست در دستگاه دیگر"}
                  </span>
                </button>
              </div>
            )}

            {/* پیست کلید اتصال برای دستگاه مقصد */}
            <div className="flex gap-2 mt-2">
              <input
                value={pastePairToken}
                onChange={(e) => setPastePairToken(e.target.value)}
                placeholder="پیست کلید اتصال دریافت شده از دستگاه دیگر…"
                className="flex-1 rounded-lg border border-sky-900/70 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-100 font-mono outline-none focus:border-sky-500"
              />
              <Button
                size="sm"
                onClick={handleApplyPairToken}
                disabled={!pastePairToken.trim()}
                className="bg-sky-600 text-white hover:bg-sky-500 text-xs font-semibold px-3"
              >
                جفت‌سازی فوری
              </Button>
            </div>
          </div>

          {/* فرم تنظیمات سرور شخصی */}
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
              onClick={() => void handleCloudSync()}
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
