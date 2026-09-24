import { WeeklyStreak } from "@/components/WeeklyStreak.tsx";
import { Button } from "@/components/ui/button.tsx";
import type { Task } from "@/lib/types.ts";
import { Flame, X } from "lucide-react";

interface Props {
  open: boolean;
  tasks: Task[];
  onClose: () => void;
}

export function StreakModal({ open, tasks, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
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
            <h2 className="text-base font-semibold text-zinc-100">آمار و پیوستگی هفتگی</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="بستن" onClick={onClose}>
            <X />
          </Button>
        </div>

        <WeeklyStreak tasks={tasks} />

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            بستن
          </Button>
        </div>
      </div>
    </div>
  );
}
