import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/input.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import type { Language } from "@/lib/types.ts";
import { Brain, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  memory: string;
  lang?: Language;
  onSave: (memory: string) => void;
  onClose: () => void;
}

const MEMORY_PROMPTS_FA = [
  "همیشه تسک‌های مربوط به کار و پروژه را با اولویت بالا تنظیم کن",
  "قبل از ساعت ۹ صبح و بعد از ۱۰ شب تسک موعددار نگذار",
  "برای تمام تسک‌های مربوط به مطالعه برچسب #کتاب بگذار",
  "در روزهای پنجشنبه و جمعه فقط کارهای شخصی و تفریحی ثبت کن",
];

const MEMORY_PROMPTS_EN = [
  "Always set deep-work coding tasks to High Priority",
  "Do not schedule deadlines before 9:00 AM or after 10:00 PM",
  "Tag all reading and learning commitments with #books",
  "Keep weekends focused on personal, health, and family habits",
];

export function AIMemorySheet({ open, memory, lang = "fa", onSave, onClose }: Props) {
  const t = getTranslation(lang);
  const isFa = lang === "fa";
  const [value, setValue] = useState(memory);

  useEffect(() => {
    setValue(memory);
  }, [memory, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  const addPreset = (text: string) => {
    setValue((prev) => (prev.trim() ? `${prev.trim()}\n- ${text}` : `- ${text}`));
  };

  const memoryPrompts = isFa ? MEMORY_PROMPTS_FA : MEMORY_PROMPTS_EN;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-violet-950/80 border border-violet-800/60 text-violet-400">
              <Brain className="size-4" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100">{t.aiMemoryTitle}</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label={t.close} onClick={onClose}>
            <X />
          </Button>
        </div>

        <p className="mb-3 text-xs leading-6 text-zinc-400">{t.aiMemoryDesc}</p>

        <div className="space-y-3">
          <Textarea
            autoFocus
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.aiMemoryPlaceholder}
            className="font-normal text-xs leading-5 border-zinc-700/80 bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-400 focus:ring-violet-400/40"
          />

          <div>
            <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
              <Sparkles className="size-3 text-violet-400" />
              {t.aiMemoryQuickPrompts}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {memoryPrompts.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => addPreset(prompt)}
                  className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-300 transition hover:border-violet-700/70 hover:bg-violet-950/30 hover:text-violet-200 cursor-pointer text-start"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
          <span className="text-[11px] text-zinc-500">
            {value.trim() ? t.aiMemoryActive : t.aiMemoryEmpty}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-violet-600 text-white hover:bg-violet-500 font-medium"
            >
              {t.aiMemorySave}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
