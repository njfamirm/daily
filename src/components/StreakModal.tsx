import { WeeklyStreak } from "@/components/WeeklyStreak.tsx";
import { Button } from "@/components/ui/button.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import type { Language, Task } from "@/lib/types.ts";
import { Flame, X } from "lucide-react";

interface Props {
  open: boolean;
  tasks: Task[];
  lang?: Language;
  onClose: () => void;
}

export function StreakModal({ open, tasks, lang = "fa", onClose }: Props) {
  const t = getTranslation(lang);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-orange-950/80 border border-orange-800/60 text-orange-400">
              <Flame className="size-4" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100">{t.streakTitle}</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label={t.close} onClick={onClose}>
            <X />
          </Button>
        </div>

        <WeeklyStreak tasks={tasks} lang={lang} />

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
