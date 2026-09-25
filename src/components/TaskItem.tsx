import { TaskEditModal } from "@/components/TaskEditModal.tsx";
import { Button } from "@/components/ui/button.tsx";
import { hapticLight, hapticSelection } from "@/lib/haptics.ts";
import { getTranslation } from "@/lib/i18n.ts";
import { formatDue } from "@/lib/parse.ts";
import { getTagStyle, PRIORITY_CONFIG } from "@/lib/tags.ts";
import type { Language, Priority, SnoozePreset, Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { AlertCircle, ArrowDown, Check, Flame, Pencil, Repeat2, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  task: Task;
  lang?: Language;
  existingTags?: string[];
  onToggle: (id: string, event?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, title: string, description?: string | null) => void;
  onUpdate?: (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onSnooze?: (id: string, preset: SnoozePreset) => void;
  onSelectTag?: (tag: string) => void;
}

const NEXT_PRIORITY: Record<Priority, Priority> = {
  none: "high",
  high: "medium",
  medium: "low",
  low: "none",
};

export function TaskItem({
  task,
  lang = "fa",
  existingTags = [],
  onToggle,
  onDelete,
  onRename,
  onUpdate,
  onSelectTag,
}: Props) {
  const t = getTranslation(lang);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const overdue = !task.done && task.due !== null && new Date(task.due).getTime() <= Date.now();
  const priority = task.priority || "none";
  const priorityCfg = PRIORITY_CONFIG[priority];

  const repeatLabels: Record<Task["repeat"], string> = {
    daily: lang === "fa" ? "هر روز" : "Daily",
    weekly: lang === "fa" ? "هر هفته" : "Weekly",
    monthly: lang === "fa" ? "هر ماه" : "Monthly",
    none: "",
  };

  const handleCyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    void hapticSelection();
    const next = NEXT_PRIORITY[priority];
    if (onUpdate) {
      onUpdate(task.id, { priority: next });
    }
  };

  const handleSaveModal = (updates: {
    title: string;
    description: string | null;
    priority: Priority;
    due: string | null;
    repeat: Task["repeat"];
    tags: string[];
  }) => {
    if (onUpdate) {
      onUpdate(task.id, updates);
    } else if (onRename) {
      onRename(task.id, updates.title, updates.description);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center gap-3.5 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 sm:p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/80 shadow-xs",
          priorityCfg.border,
          priority === "high" &&
            !task.done &&
            "border-red-800/70 bg-red-950/20 shadow-xs shadow-red-950/40 hover:border-red-700",
          overdue && "border-red-900/70 bg-red-950/30 hover:border-red-700",
          task.done &&
            "border-transparent bg-transparent opacity-60 hover:border-zinc-800/60 hover:bg-zinc-900/30",
        )}
      >
        {/* Checkbox Toggle */}
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

        {/* Task Content - Clicking opens Edit Modal */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditModalOpen(true)}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "block text-start text-base sm:text-lg leading-snug transition-colors",
                  task.done
                    ? "text-zinc-500 line-through font-normal text-sm"
                    : priority === "high"
                      ? "text-white font-bold tracking-tight"
                      : "text-zinc-100 font-semibold hover:text-white",
                )}
              >
                {task.title}
              </span>

              {/* Priority Badges - Clickable to cycle priority */}
              {priority === "high" && !task.done && (
                <button
                  type="button"
                  onClick={handleCyclePriority}
                  title={t.priorityChange}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-700/90 bg-red-900/80 px-2 py-0.5 text-xs font-bold text-red-100 shadow-xs hover:bg-red-800 transition-colors cursor-pointer"
                >
                  <Flame className="size-3.5 text-red-300 fill-red-400/30" />
                  <span>{t.priorityHigh}</span>
                </button>
              )}

              {priority === "medium" && !task.done && (
                <button
                  type="button"
                  onClick={handleCyclePriority}
                  title={t.priorityChange}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-800/80 bg-amber-950/80 px-2 py-0.5 text-[11px] font-medium text-amber-300 hover:bg-amber-900 transition-colors cursor-pointer"
                >
                  <AlertCircle className="size-3 text-amber-400" />
                  <span>{t.priorityMedium}</span>
                </button>
              )}

              {priority === "low" && !task.done && (
                <button
                  type="button"
                  onClick={handleCyclePriority}
                  title={t.priorityChange}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-800/80 bg-blue-950/80 px-2 py-0.5 text-[11px] font-medium text-blue-300 hover:bg-blue-900 transition-colors cursor-pointer"
                >
                  <ArrowDown className="size-3 text-blue-400" />
                  <span>{t.priorityLow}</span>
                </button>
              )}
            </div>

            {task.description && task.description.trim() && (
              <p
                className={cn(
                  "mt-1 text-xs sm:text-[13px] leading-relaxed transition-colors line-clamp-2",
                  task.done ? "text-zinc-600 line-through" : "text-zinc-400 font-normal",
                )}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* Sub-meta: Due date, recurrence, tags */}
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
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-transform hover:scale-105 active:scale-95 cursor-pointer",
                    style.bg,
                    style.text,
                    style.border,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", style.dot)} />#{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Actions: Edit & Safe Delete */}
        <div className="relative flex items-center gap-1 shrink-0">
          {/* Quick Priority Toggle (When task has no priority) */}
          {priority === "none" && !task.done && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t.priorityChange}
              title={t.priorityChange}
              onClick={handleCyclePriority}
              className="opacity-40 group-hover:opacity-100 hover:opacity-100 text-zinc-400 hover:text-red-400 transition-opacity"
            >
              <Flame className="size-4" />
            </Button>
          )}

          {/* Edit Task Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.editTaskAria}
            title={t.editTask}
            onClick={() => {
              void hapticLight();
              setEditModalOpen(true);
            }}
            className="opacity-50 group-hover:opacity-100 hover:opacity-100 text-zinc-400 hover:text-white transition-opacity"
          >
            <Pencil className="size-4" />
          </Button>

          {/* Delete Task Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.deleteAria}
            title={t.deleteTask}
            onClick={() => onDelete(task.id)}
            className="opacity-40 group-hover:opacity-100 hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-opacity"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Full Task Edit Modal */}
      <TaskEditModal
        open={editModalOpen}
        task={task}
        lang={lang}
        existingTags={existingTags}
        onSave={handleSaveModal}
        onDelete={onDelete}
        onClose={() => setEditModalOpen(false)}
      />
    </>
  );
}
