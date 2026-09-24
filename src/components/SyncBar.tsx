import { AIMemorySheet } from "@/components/AIMemorySheet.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/input.tsx";
import { buildPayload } from "@/lib/payload.ts";
import { parseIncoming } from "@/lib/store.ts";
import type { DB } from "@/lib/types.ts";
import { Brain, Check, ClipboardCopy, ClipboardPaste } from "lucide-react";
import { useState } from "react";

interface Props {
  db: DB;
  onReplace: (db: DB) => void;
  onUpdateMemory?: (memory: string) => void;
  onMessage: (text: string, undo?: () => void) => void;
}

/** کپی کل دیتا (همراه توضیح ساختار برای AI) و پیست‌کردن نسخه ویرایش‌شده. */
export function SyncBar({ db, onReplace, onUpdateMemory, onMessage }: Props) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);

  const copy = async () => {
    const text = buildPayload(db);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setFallback(text);
    }
  };

  const apply = (text: string) => {
    const before = db;
    try {
      onReplace(parseIncoming(text));
      setFallback(null);
      onMessage("دیتا جایگزین شد", () => onReplace(before));
    } catch (err) {
      onMessage(`پیست نشد: ${err instanceof Error ? err.message : "ورودی نامعتبر"}`);
    }
  };

  const paste = async () => {
    try {
      apply(await navigator.clipboard.readText());
    } catch {
      setFallback("");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy} title="کپی کل دیتا برای AI">
          {copied ? <Check /> : <ClipboardCopy />}
          {copied ? "کپی شد" : "کپی برای AI"}
        </Button>
        <Button variant="outline" size="sm" onClick={paste} title="جایگزینی با خروجی AI">
          <ClipboardPaste />
          پیست
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMemoryOpen(true)}
          title="حافظه و دستورالعمل‌های اختصاصی هوش مصنوعی"
          className="gap-1.5 border-violet-800/60 bg-violet-950/30 text-violet-300 hover:bg-violet-900/40 hover:border-violet-600"
        >
          <Brain className="size-3.5 text-violet-400" />
          حافظه AI
          {db.aiMemory?.trim() && (
            <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
          )}
        </Button>
      </div>

      <AIMemorySheet
        open={memoryOpen}
        memory={db.aiMemory || ""}
        onSave={(mem) => {
          onUpdateMemory?.(mem);
          onMessage("حافظه AI به‌روزرسانی شد");
        }}
        onClose={() => setMemoryOpen(false)}
      />

      {fallback !== null && (
        <div className="mt-2 space-y-2">
          <Textarea
            autoFocus
            rows={6}
            defaultValue={fallback}
            placeholder="خروجی AI را اینجا پیست کن…"
            className="font-mono text-xs"
            onKeyDown={(e) => {
              if (e.key === "Escape") setFallback(null);
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) apply(e.currentTarget.value);
            }}
            id="sync-fallback"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                apply(document.querySelector<HTMLTextAreaElement>("#sync-fallback")?.value ?? "")
              }
            >
              اعمال کن
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setFallback(null)}>
              بی‌خیال
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
