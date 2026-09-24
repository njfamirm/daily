import { decryptData, encryptData } from "@/lib/crypto.ts";
import { mergeDBs } from "@/lib/syncEngine.ts";
import type { DB } from "@/lib/types.ts";

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  vaultId: string;
  secretKey: string;
  authToken?: string;
  lastSyncedAt?: number;
}

const STORAGE_KEY = "taskdrop_cloud_sync_config";

export function loadSyncConfig(): SyncConfig {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem("daily_cloud_sync_config");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    enabled: false,
    serverUrl: "",
    vaultId: "",
    secretKey: "",
    authToken: "",
  };
}

export function saveSyncConfig(cfg: SyncConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

function getAuthHeaders(authToken?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken && authToken.trim()) {
    headers["Authorization"] = `Bearer ${authToken.trim()}`;
  }
  return headers;
}

/**
 * ارسال نسخه فعلی به سرور والت شخصی (Push)
 */
export async function pushToVault(
  serverUrl: string,
  vaultId: string,
  secretKey: string,
  db: DB,
  authToken?: string,
): Promise<{ ok: boolean; updatedAt: number }> {
  if (!serverUrl || !vaultId || !secretKey) {
    throw new Error("تنظیمات سرور یا کلید والت کامل نیست");
  }

  const cleanUrl = serverUrl.replace(/\/+$/, "");
  const plainText = JSON.stringify(db);
  const cipher = await encryptData(plainText, secretKey);

  const res = await fetch(`${cleanUrl}/api/sync/${encodeURIComponent(vaultId)}`, {
    method: "POST",
    headers: getAuthHeaders(authToken),
    body: JSON.stringify({
      payload: cipher,
      updatedAt: Date.now(),
      version: 1,
    }),
  });

  if (res.status === 401) {
    throw new Error("توکن امنیتی سرور نامعتبر است (401 Unauthorized)");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`خطای سرور (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { ok: true, updatedAt: data.updatedAt };
}

/**
 * دریافت آخرین نسخه والت از سرور (Pull)
 */
export async function pullFromVault(
  serverUrl: string,
  vaultId: string,
  secretKey: string,
  authToken?: string,
): Promise<{ db: DB; updatedAt: number } | null> {
  if (!serverUrl || !vaultId || !secretKey) {
    return null;
  }

  const cleanUrl = serverUrl.replace(/\/+$/, "");
  const res = await fetch(`${cleanUrl}/api/sync/${encodeURIComponent(vaultId)}`, {
    headers: getAuthHeaders(authToken),
  });

  if (res.status === 401) {
    throw new Error("توکن امنیتی سرور نامعتبر است (401 Unauthorized)");
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`خطا در ارتباط با سرور (${res.status})`);
  }

  const data = await res.json();
  const plainText = await decryptData(data.payload, secretKey);
  const incomingDb = JSON.parse(plainText) as DB;

  return {
    db: incomingDb,
    updatedAt: data.updatedAt,
  };
}

/**
 * همگام‌سازی دوطرفه خودکار (Pull -> Merge -> Push در صورت تغییر)
 */
export async function syncVault(
  config: SyncConfig,
  currentDb: DB,
): Promise<{ mergedDb: DB; updated: boolean }> {
  if (!config.enabled || !config.serverUrl || !config.vaultId || !config.secretKey) {
    return { mergedDb: currentDb, updated: false };
  }

  const remote = await pullFromVault(
    config.serverUrl,
    config.vaultId,
    config.secretKey,
    config.authToken,
  );

  if (!remote) {
    // والت در سرور وجود نداشت، نسخه محلی آپلود می‌شود
    await pushToVault(
      config.serverUrl,
      config.vaultId,
      config.secretKey,
      currentDb,
      config.authToken,
    );
    return { mergedDb: currentDb, updated: true };
  }

  const merged = mergeDBs(currentDb, remote.db);
  const isChanged = JSON.stringify(merged) !== JSON.stringify(remote.db);

  if (isChanged) {
    await pushToVault(config.serverUrl, config.vaultId, config.secretKey, merged, config.authToken);
  }

  return {
    mergedDb: merged,
    updated: true,
  };
}
