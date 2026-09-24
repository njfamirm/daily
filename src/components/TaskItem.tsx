import { Button } from "@/components/ui/button.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import { formatDue } from "@/lib/parse.ts";
import { getTagStyle, PRIORITY_CONFIG } from "@/lib/tags.ts";
import type { Language, SnoozePreset, Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { AlarmClock, Check, Flame, Repeat2, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  task: Task;
  lang?: Language;
  onToggle: (id: string, event?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string, description?: string | null) => void;
  onSnooze?: (id: string, preset: SnoozePreset) => void;
}

export function TaskItem({ task, lang = "fa", onToggle, onDelete, onRename, onSnooze }: Props) {
  const t = getTranslation(lang);
  const [editing, setEditing] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const overdue = !task.done && task.due !== null && new Date(task.due).getTime() <= Date.now();
  const priority = task.priority || "none";
  const priorityCfg = PRIORITY_CONFIG[priority];

  const repeatLabels: Record<Task["repeat"], string> = {
    daily: lang === "fa" ? "هر روز" : "Daily",
    weekly: lang === "fa" ? "هر هفته" : "Weekly",
    monthly: lang === "fa" ? "هر ماه" : "Monthly",
    none: "",
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3.5 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-xs",
        priorityCfg.border,
        priority === "high" &&
          !task.done &&
          "border-red-800/70 bg-red-950/20 shadow-xs shadow-red-950/40 hover:border-red-700",
        overdue && "border-red-900/70 bg-red-950/30 hover:border-red-700",
        task.done &&
          "border-transparent bg-transparent opacity-60 hover:border-zinc-800/60 hover:bg-zinc-900/30",
      )}
    >
      <button
        type="button"
        aria-label={task.done ? t.taskUndoAria : t.taskDoneAria}
        onClick={(e) => onToggle(task.id, e)}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-lg border border-zinc-600 bg-zinc-800/80 transition-all hover:border-zinc-200 hover:scale-105 active:scale-95 cursor-pointer",
          task.done && "border-white bg-white text-black",
          overdue && "ring-alert border-red-400 text-red-400",
        )}
      >
        {task.done && <Check className="size-4" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="space-y-1.5">
            <input
              autoFocus
              defaultValue={task.title}
              placeholder={t.taskTitlePlaceholder}
              className="w-full rounded-lg bg-zinc-800/95 px-2 py-1 text-base font-medium text-zinc-100 outline-none ring-2 ring-zinc-400"
              onBlur={(e) => {
                onRename(task.id, e.target.value, task.description);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={cn(
                  "block text-start text-base sm:text-lg leading-snug transition-colors cursor-text",
                  task.done
                    ? "text-zinc-500 line-through font-normal text-sm"
                    : priority === "high"
                      ? "text-white font-bold tracking-tight"
                      : "text-zinc-100 font-semibold hover:text-white",
                )}
              >
                {task.title}
              </button>
              {priority === "high" && !task.done && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-700/90 bg-red-900/80 px-2 py-0.5 text-xs font-bold text-red-100 shadow-xs">
                  <Flame className="size-3.5 text-red-300 fill-red-400/30" />
                  {t.priorityHigh}
                </span>
              )}
              {priority === "medium" && !task.done && (
                <span className="inline-flex shrink-0 items-center rounded-md border border-amber-800/80 bg-amber-950/80 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">
                  {t.priorityMedium}
                </span>
              )}
            </div>

            {task.description && task.description.trim() && (
              <p
                className={cn(
                  "mt-1 text-xs sm:text-[13px] leading-relaxed transition-colors",
                  task.done ? "text-zinc-600 line-through" : "text-zinc-400 font-normal",
                )}
              >
                {task.description}
              </p>
            )}
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          {task.due && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 bg-zinc-800/90 text-zinc-200 font-medium text-xs",
                overdue && "bg-red-950/90 text-red-200 border border-red-800/80 font-semibold",
              )}
            >
              {formatDue(task.due, lang)}
            </span>
          )}
          {task.repeat !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/90 px-1.5 py-0.5 text-xs text-zinc-300">
              <Repeat2 className="size-3.5" />
              {repeatLabels[task.repeat]}
            </span>
          )}
          {task.tags.map((tag) => {
            const style = getTagStyle(tag);
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                  style.bg,
                  style.text,
                  style.border,
                )}
              >
                <span className={cn("size-1.5 rounded-full", style.dot)} />#{tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* Side Actions: Snooze & Delete */}
      <div className="relative flex items-center gap-1">
        {!task.done && onSnooze && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t.snoozeTitle}
              title={t.snoozeTitle}
              onClick={() => setSnoozeOpen((prev) => !prev)}
              className={cn(
                "transition-opacity",
                overdue
                  ? "text-amber-400 hover:text-amber-300"
                  : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-zinc-400",
              )}
            >
              <AlarmClock className="size-4" />
            </Button>

            {snoozeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSnoozeOpen(false)} />
                <div className="absolute end-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/95 p-1 text-xs shadow-xl backdrop-blur-md">
                  <div className="px-2 py-1 text-[10px] font-medium text-zinc-500 border-b border-zinc-800">
                    {t.snoozeTo}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "15m");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  >
                    <span>{t.snooze15m}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "1h");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  >
                    <span>{t.snooze1h}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "tomorrow");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  >
                    <span>{t.snoozeTomorrow}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "weekend");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  >
                    <span>{t.snoozeWeekend}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <Button
          variant="danger"
          size="icon"
          aria-label={t.deleteAria}
          onClick={() => onDelete(task.id)}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
