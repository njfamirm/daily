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
        "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-neutral-800 hover:bg-neutral-900/50",
        overdue && "border-neutral-700 bg-neutral-900",
      )}
    >
      <button
        type="button"
        aria-label={task.done ? "برگردان" : "انجام شد"}
        onClick={() => onToggle(task.id)}
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border border-neutral-700 transition-colors hover:border-neutral-400",
          task.done && "border-white bg-white text-black",
          overdue && "ring-alert border-neutral-400",
        )}
      >
        {task.done && <Check className="size-3.5" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={task.title}
            className="w-full bg-transparent text-sm text-neutral-100 outline-none"
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
              "block w-full truncate text-start text-sm",
              task.done ? "text-neutral-600 line-through" : "text-neutral-100",
            )}
          >
            {task.title}
          </button>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
          {task.due && (
            <span className={cn(overdue && "font-medium text-red-400")}>{formatDue(task.due)}</span>
          )}
          {task.repeat !== "none" && (
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="size-3" />
              {REPEAT_LABEL[task.repeat]}
            </span>
          )}
          {task.tags.map((t) => (
            <span key={t} className="text-neutral-600">
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
