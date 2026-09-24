export interface KVNamespace {
  get<T = string>(
    key: string,
    type?: "text" | "json" | "arrayBuffer" | "stream",
  ): Promise<T | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  VAULTS: KVNamespace;
  AUTH_TOKEN?: string;
}

interface SyncPayload {
  payload: string;
  version?: number;
  updatedAt?: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Auth-Token, X-Vault-Key",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

// بررسی توکن احراز هویت سرور
function isAuthorized(request: Request, env: Env): boolean {
  if (!env.AUTH_TOKEN || !env.AUTH_TOKEN.trim()) {
    return true; // در صورت خالی بودن، دسترسی باز است
  }

  const authHeader = request.headers.get("Authorization") || "";
  const customHeader = request.headers.get("X-Auth-Token") || "";

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim() || customHeader.trim();

  return token === env.AUTH_TOKEN.trim();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // ۱. پاسخ به پیش‌پرواز CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // ۲. بررسی سلامت سرویس
    if (pathname === "/health" || pathname === "/api/health") {
      return jsonResponse({
        status: "healthy",
        platform: "cloudflare-workers",
        protected: Boolean(env.AUTH_TOKEN?.trim()),
        time: new Date().toISOString(),
      });
    }

    // ۳. اعتبارسنجی توکن دسترسی سرور
    if (!isAuthorized(request, env)) {
      return jsonResponse({ error: "Unauthorized: Invalid or missing server access token" }, 401);
    }

    // ۴. روت‌های والت سینک: /api/sync/:vaultId
    const syncMatch = pathname.match(/^\/api\/sync\/([^/]+)$/);
    if (!syncMatch) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    const vaultId = syncMatch[1];

    // ۴.۱. خواندن والت (GET)
    if (request.method === "GET") {
      try {
        const data = await env.VAULTS.get<SyncPayload>(vaultId, "json");
        if (!data) {
          return jsonResponse({ error: "Vault not found" }, 404);
        }
        return jsonResponse({
          vaultId,
          version: data.version ?? 1,
          updatedAt: data.updatedAt ?? Date.now(),
          payload: data.payload,
        });
      } catch (err) {
        return jsonResponse(
          { error: "KV read error", message: err instanceof Error ? err.message : String(err) },
          500,
        );
      }
    }

    // ۴.۲. ذخیره و به‌روزرسانی والت (POST)
    if (request.method === "POST") {
      try {
        const body = (await request.json()) as SyncPayload;
        if (!body.payload || typeof body.payload !== "string") {
          return jsonResponse({ error: "Field 'payload' is required and must be a string" }, 400);
        }

        const now = body.updatedAt ?? Date.now();
        const payloadToStore: SyncPayload = {
          payload: body.payload,
          version: body.version ?? 1,
          updatedAt: now,
        };

        // ذخیره در Cloudflare KV
        await env.VAULTS.put(vaultId, JSON.stringify(payloadToStore));

        return jsonResponse({
          ok: true,
          vaultId,
          updatedAt: now,
        });
      } catch (err) {
        return jsonResponse(
          { error: "Invalid JSON body", message: err instanceof Error ? err.message : String(err) },
          400,
        );
      }
    }

    // ۴.۳. حذف والت (DELETE)
    if (request.method === "DELETE") {
      try {
        await env.VAULTS.delete(vaultId);
        return jsonResponse({ ok: true, deleted: vaultId });
      } catch (err) {
        return jsonResponse(
          { error: "KV delete error", message: err instanceof Error ? err.message : String(err) },
          500,
        );
      }
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  },
};
