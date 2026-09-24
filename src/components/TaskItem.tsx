import { Button } from "@/components/ui/button.tsx";
import { formatDue } from "@/lib/parse.ts";
import { getTagStyle, PRIORITY_CONFIG } from "@/lib/tags.ts";
import type { Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { AlarmClock, Check, Flame, Repeat2, Trash2 } from "lucide-react";
import { useState } from "react";

const REPEAT_LABEL = { daily: "هر روز", weekly: "هر هفته", monthly: "هر ماه", none: "" };

export type SnoozePreset = "15m" | "1h" | "tomorrow" | "weekend";

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onSnooze?: (id: string, preset: SnoozePreset) => void;
}

export function TaskItem({ task, onToggle, onDelete, onRename, onSnooze }: Props) {
  const [editing, setEditing] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const overdue = !task.done && task.due !== null && new Date(task.due).getTime() <= Date.now();
  const priority = task.priority || "none";
  const priorityCfg = PRIORITY_CONFIG[priority];

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3.5 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80",
        priorityCfg.border,
        overdue && "border-red-900/50 bg-red-950/20 hover:border-red-800/70",
        task.done &&
          "border-transparent bg-transparent opacity-65 hover:border-zinc-800/60 hover:bg-zinc-900/30",
      )}
    >
      <button
        type="button"
        aria-label={task.done ? "برگردان" : "انجام شد"}
        onClick={() => onToggle(task.id)}
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border border-zinc-600 bg-zinc-800/60 transition-colors hover:border-zinc-300",
          task.done && "border-white bg-white text-black",
          overdue && "ring-alert border-red-400 text-red-400",
        )}
      >
        {task.done && <Check className="size-3.5" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={task.title}
            className="w-full rounded bg-zinc-800/90 px-1.5 py-0.5 text-sm text-zinc-100 outline-none ring-1 ring-zinc-400"
            onBlur={(e) => {
              onRename(task.id, e.target.value);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={cn(
                "block truncate text-start text-sm font-normal transition-colors",
                task.done ? "text-zinc-500 line-through" : "text-zinc-100 hover:text-white",
              )}
            >
              {task.title}
            </button>
            {priority === "high" && !task.done && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-red-800/80 bg-red-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-red-300 shadow-xs">
                <Flame className="size-3 text-red-400" />
                فوری
              </span>
            )}
            {priority === "medium" && !task.done && (
              <span className="inline-flex shrink-0 items-center rounded-md border border-amber-800/80 bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                متوسط
              </span>
            )}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          {task.due && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 bg-zinc-800/80 text-zinc-300 font-medium text-[11px]",
                overdue && "bg-red-950/70 text-red-300 border border-red-800/60",
              )}
            >
              {formatDue(task.due)}
            </span>
          )}
          {task.repeat !== "none" && (
            <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[11px] text-zinc-300">
              <Repeat2 className="size-3" />
              {REPEAT_LABEL[task.repeat]}
            </span>
          )}
          {task.tags.map((t) => {
            const style = getTagStyle(t);
            return (
              <span
                key={t}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                  style.bg,
                  style.text,
                  style.border,
                )}
              >
                <span className={cn("size-1.5 rounded-full", style.dot)} />#{t}
              </span>
            );
          })}
        </div>
      </div>

      {/* دکمه‌های کناری: تعویق و حذف */}
      <div className="relative flex items-center gap-1">
        {!task.done && onSnooze && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="تعویق موعد"
              title="تعویق هوشمند (Snooze)"
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
                    تعویق موعد به:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "15m");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                  >
                    <span>+۱۵ دقیقه</span>
                    <span className="text-[10px] text-zinc-500">15m</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "1h");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                  >
                    <span>+۱ ساعت</span>
                    <span className="text-[10px] text-zinc-500">1h</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "tomorrow");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                  >
                    <span>فردا ۸:۳۰ صبح</span>
                    <span className="text-[10px] text-zinc-500">فردا</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSnooze(task.id, "weekend");
                      setSnoozeOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                  >
                    <span>شنبه بعد ۹:۰۰</span>
                    <span className="text-[10px] text-zinc-500">شنبه</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <Button
          variant="danger"
          size="icon"
          aria-label="حذف"
          onClick={() => onDelete(task.id)}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
