import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/input.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import type { Language } from "@/lib/types.ts";
import { Brain, Sparkles } from "lucide-react";
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

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  const addPreset = (text: string) => {
    setValue((prev) => (prev.trim() ? `${prev.trim()}\n- ${text}` : `- ${text}`));
  };

  const memoryPrompts = isFa ? MEMORY_PROMPTS_FA : MEMORY_PROMPTS_EN;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Brain className="size-4" />
            </div>
            <DialogTitle>{t.aiMemoryTitle}</DialogTitle>
          </div>
          <DialogDescription>{t.aiMemoryDesc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <Textarea
            rows={5}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.aiMemoryPlaceholder}
            className="font-normal text-xs leading-5"
          />

          <div>
            <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
              <Sparkles className="size-3 text-amber-400" />
              {t.aiMemoryQuickPrompts}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {memoryPrompts.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => addPreset(prompt)}
                  className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 cursor-pointer text-start"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
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
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold"
            >
              {t.aiMemorySave}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
