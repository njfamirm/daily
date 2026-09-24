import { Button } from "@/components/ui/button.tsx";
import { formatDue } from "@/lib/parse.ts";
import type { Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { Check, Repeat2, Trash2 } from "lucide-react";
import { useState } from "react";

const REPEAT_LABEL = { daily: "هر روز", weekly: "هر هفته", monthly: "هر ماه", none: "" };

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function TaskItem({ task, onToggle, onDelete, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const overdue = !task.done && task.due !== null && new Date(task.due).getTime() <= Date.now();

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3.5 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80",
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
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={cn(
              "block w-full truncate text-start text-sm font-normal transition-colors",
              task.done ? "text-zinc-500 line-through" : "text-zinc-100 hover:text-white",
            )}
          >
            {task.title}
          </button>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          {task.due && (
            <span
              className={cn(
                "rounded px-1.5 py-0.2 bg-zinc-800/60 text-zinc-300 font-medium",
                overdue && "bg-red-950/60 text-red-300 border border-red-800/50",
              )}
            >
              {formatDue(task.due)}
            </span>
          )}
          {task.repeat !== "none" && (
            <span className="inline-flex items-center gap-1 rounded bg-zinc-800/60 px-1.5 py-0.2 text-zinc-300">
              <Repeat2 className="size-3" />
              {REPEAT_LABEL[task.repeat]}
            </span>
          )}
          {task.tags.map((t) => (
            <span
              key={t}
              className="rounded border border-zinc-700/60 bg-zinc-800/40 px-1.5 py-0.2 text-[11px] text-zinc-400"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

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
  );
}
