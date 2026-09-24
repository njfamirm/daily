import { loadSyncConfig, pullFromVault, pushToVault, saveSyncConfig } from "@/lib/cloudSync.ts";
import { mergeDBs } from "@/lib/syncEngine.ts";
import type { DB } from "@/lib/types.ts";
import { useEffect, useRef } from "react";

interface AutoSyncOptions {
  db: DB;
  onApplyRemote: (newDb: DB) => void;
  onStatusMessage?: (msg: string) => void;
}

export function useAutoCloudSync({ db, onApplyRemote }: AutoSyncOptions) {
  const lastPushedJsonRef = useRef<string>("");
  const isSyncingRef = useRef<boolean>(false);
  const lastRemoteUpdatedRef = useRef<number>(0);
  const hasLocalEditsRef = useRef<boolean>(false);
  const dbRef = useRef<DB>(db);
  dbRef.current = db;

  // ۱. بررسی و دانلود فوری تغییرات جدید از سرور (Fast Pull & Apply)
  const syncPull = async () => {
    const config = loadSyncConfig();
    if (!config.serverUrl || !config.vaultId || !config.secretKey || isSyncingRef.current) {
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

      if (remote && remote.updatedAt > lastRemoteUpdatedRef.current) {
        lastRemoteUpdatedRef.current = remote.updatedAt;
        const currentLocal = dbRef.current;
        const currentLocalStr = JSON.stringify(currentLocal);
        const remoteStr = JSON.stringify(remote.db);

        if (remoteStr !== currentLocalStr) {
          // اگر تغییرات لوکال ذخیره‌نشده نداشتیم، دیتای سرور مستقیم اعمال می‌شود
          if (!hasLocalEditsRef.current) {
            lastPushedJsonRef.current = remoteStr;
            onApplyRemote(remote.db);
          } else {
            // در صورت وجود تغییر همزمان، ادغام هوشمند انجام می‌شود
            const merged = mergeDBs(currentLocal, remote.db);
            const mergedStr = JSON.stringify(merged);
            lastPushedJsonRef.current = mergedStr;
            hasLocalEditsRef.current = false;
            onApplyRemote(merged);

            // ارسال دیتای مرج شده به سرور
            void pushToVault(
              config.serverUrl,
              config.vaultId,
              config.secretKey,
              merged,
              config.authToken,
            );
          }
        }

        saveSyncConfig({ ...config, lastSyncedAt: remote.updatedAt, enabled: true });
      }
    } catch {
      // سایلنت در پس‌زمینه
    } finally {
      isSyncingRef.current = false;
    }
  };

  // ۲. ارسال فوق‌سریع تغییرات محلی به سرور (Fast Push با ۵۰۰ میلی‌ثانیه تاخیر)
  useEffect(() => {
    const config = loadSyncConfig();
    if (!config.serverUrl || !config.vaultId || !config.secretKey) {
      return;
    }

    const currentJson = JSON.stringify(db);
    if (!lastPushedJsonRef.current) {
      // مقداردهی اولیه برای جلوگیری از پوش بی‌مورد هنگام لود
      lastPushedJsonRef.current = currentJson;
      void syncPull();
      return;
    }

    if (lastPushedJsonRef.current === currentJson) {
      return;
    }

    hasLocalEditsRef.current = true;
    const timer = setTimeout(async () => {
      try {
        isSyncingRef.current = true;
        const res = await pushToVault(
          config.serverUrl,
          config.vaultId,
          config.secretKey,
          db,
          config.authToken,
        );
        lastPushedJsonRef.current = currentJson;
        lastRemoteUpdatedRef.current = res.updatedAt;
        hasLocalEditsRef.current = false;
        saveSyncConfig({ ...config, lastSyncedAt: res.updatedAt, enabled: true });
      } catch {
        // خطا در پس‌زمینه
      } finally {
        isSyncingRef.current = false;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [db]);

  // ۳. بررسی فوق‌سریع و زنده (رویدادها + پول هر ۳ ثانیه)
  useEffect(() => {
    void syncPull();

    let lastInteraction = 0;
    const handleInteraction = () => {
      const now = Date.now();
      if (now - lastInteraction > 2000) {
        lastInteraction = now;
        void syncPull();
      }
    };

    const handleFocus = () => void syncPull();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncPull();
      }
    };
    const handleOnline = () => void syncPull();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pointerdown", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    // پول دوره‌ای سریع هر ۳ ثانیه برای دریافت تغییرات بلادرنگ
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncPull();
      }
    }, 3000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);
}
