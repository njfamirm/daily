import { WeeklyStreak } from "@/components/WeeklyStreak.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import type { Language, Task } from "@/lib/types.ts";
import { Flame } from "lucide-react";

interface Props {
  open: boolean;
  tasks: Task[];
  lang?: Language;
  onClose: () => void;
}

export function StreakModal({ open, tasks, lang = "fa", onClose }: Props) {
  const t = getTranslation(lang);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Flame className="size-4" />
            </div>
            <DialogTitle>{t.streakTitle}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-2">
          <WeeklyStreak tasks={tasks} lang={lang} />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
