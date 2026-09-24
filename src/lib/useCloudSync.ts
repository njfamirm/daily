import { loadSyncConfig, pullFromVault, pushToVault, saveSyncConfig } from "@/lib/cloudSync.ts";
import { mergeDBs } from "@/lib/syncEngine.ts";
import type { DB } from "@/lib/types.ts";
import { useEffect, useRef } from "react";

interface AutoSyncOptions {
  db: DB;
  onApplyRemote: (mergedDb: DB) => void;
  onStatusMessage?: (msg: string) => void;
}

export function useAutoCloudSync({ db, onApplyRemote }: AutoSyncOptions) {
  const lastPushedJsonRef = useRef<string>("");
  const isSyncingRef = useRef<boolean>(false);
  const dbRef = useRef<DB>(db);
  dbRef.current = db;

  // ۱. بررسی و دانلود تغییرات جدید از سرور (Pull & Merge)
  const syncPull = async () => {
    const config = loadSyncConfig();
    if (
      !config.enabled ||
      !config.serverUrl ||
      !config.vaultId ||
      !config.secretKey ||
      isSyncingRef.current
    ) {
      return;
    }

    try {
      isSyncingRef.current = true;
      const remote = await pullFromVault(
        config.serverUrl,
        config.vaultId,
        config.secretKey,
        config.authToken,
      );

      if (remote) {
        const currentLocal = dbRef.current;
        const merged = mergeDBs(currentLocal, remote.db);
        const mergedStr = JSON.stringify(merged);
        const localStr = JSON.stringify(currentLocal);

        if (mergedStr !== localStr) {
          lastPushedJsonRef.current = mergedStr;
          onApplyRemote(merged);
        }

        const now = Date.now();
        saveSyncConfig({ ...config, lastSyncedAt: now });
      }
    } catch {
      // در حالت پس‌زمینه ارور سایلنت باشد تا کاربر اذیت نشود
    } finally {
      isSyncingRef.current = false;
    }
  };

  // ۲. ارسال خودکار تغییرات محلی به سرور (Auto-Push با Debounce)
  useEffect(() => {
    const config = loadSyncConfig();
    if (!config.enabled || !config.serverUrl || !config.vaultId || !config.secretKey) {
      return;
    }

    const currentJson = JSON.stringify(db);
    if (lastPushedJsonRef.current === currentJson) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        isSyncingRef.current = true;
        await pushToVault(config.serverUrl, config.vaultId, config.secretKey, db, config.authToken);
        lastPushedJsonRef.current = currentJson;
        saveSyncConfig({ ...config, lastSyncedAt: Date.now() });
      } catch {
        // خطا در پس‌زمینه
      } finally {
        isSyncingRef.current = false;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [db]);

  // ۳. پول خودکار هنگام باز شدن تب، فوکوس، یا وصل شدن اینترنت
  useEffect(() => {
    void syncPull();

    const handleFocus = () => void syncPull();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncPull();
      }
    };
    const handleOnline = () => void syncPull();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    // پول دوره‌ای هر ۱۵ ثانیه برای دریافت تغییرات دستگاه‌های دیگر به شکل زنده
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncPull();
      }
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);
}
