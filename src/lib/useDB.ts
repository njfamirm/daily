import { loadDB, saveDB } from "@/lib/store.ts";
import type { DB } from "@/lib/types.ts";
import { useCallback, useEffect, useState } from "react";

export function useDB() {
  const [db, setDb] = useState<DB>(() => loadDB());

  useEffect(() => {
    saveDB(db);
  }, [db]);

  // همگام‌سازی بین تب‌های باز
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "daily.db.v1") setDb(loadDB());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (prev: DB) => DB) => setDb(fn), []);
  return { db, setDb, update };
}
