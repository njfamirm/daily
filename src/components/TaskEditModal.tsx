import { Button } from "@/components/ui/button.tsx";
import { Input, Textarea } from "@/components/ui/input.tsx";
import { Kbd } from "@/components/ui/kbd.tsx";
import { hapticLight, hapticSuccess, hapticWarning } from "@/lib/haptics.ts";
import { getTranslation } from "@/lib/i18n.ts";
import { parseTag } from "@/lib/tags.ts";
import type { Language, Priority, Repeat, Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import {
  AlertCircle,
  ArrowDown,
  Calendar,
  CalendarDays,
  Clock,
  Flame,
  Minus,
  Pencil,
  Plus,
  Repeat2,
  Tag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  open: boolean;
  task: Task;
  lang?: Language;
  existingTags?: string[];
  onSave: (updates: {
    title: string;
    description: string | null;
    priority: Priority;
    due: string | null;
    repeat: Repeat;
    tags: string[];
  }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const DEFAULT_TAGS_FA = ["کار", "شخصی", "پروژه", "خرید", "مالی", "ایده", "جلسه"];
const DEFAULT_TAGS_EN = ["work", "personal", "project", "shopping", "finance", "idea", "meeting"];

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromLocalDatetimeInput(val: string): string | null {
  if (!val.trim()) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function getQuickDue(type: "today" | "tomorrow" | "weekend"): string {
  const d = new Date();
  if (type === "today") {
    d.setHours(18, 0, 0, 0);
  } else if (type === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  } else if (type === "weekend") {
    const day = d.getDay(); // 0: Sun, 6: Sat
    let delta = (6 - day + 7) % 7;
    if (delta === 0) delta = 7;
    d.setDate(d.getDate() + delta);
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}

export function TaskEditModal({
  open,
  task,
  lang = "fa",
  existingTags = [],
  onSave,
  onDelete,
  onClose,
}: Props) {
  const t = getTranslation(lang);
  const isFa = lang === "fa";

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority>(task.priority || "none");
  const [due, setDue] = useState<string | null>(task.due);
  const [repeat, setRepeat] = useState<Repeat>(task.repeat || "none");
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever task or open changes
  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "none");
      setDue(task.due);
      setRepeat(task.repeat || "none");
      setTags(task.tags || []);
      setNewTagInput("");
      setConfirmDelete(false);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [task, open]);

  // Keyboard shortcuts (Escape to close, Ctrl/Cmd+Enter to save)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, title, description, priority, due, repeat, tags]);

  const allTagPool = useMemo(() => {
    const defaults = isFa ? DEFAULT_TAGS_FA : DEFAULT_TAGS_EN;
    const set = new Set([...defaults, ...existingTags]);
    return Array.from(set).filter((tag) => !tags.includes(tag));
  }, [existingTags, isFa, tags]);

  if (!open) return null;

  const handleAddTag = (rawTag: string) => {
    const cleanTag = rawTag.trim().replace(/^#/, "");
    if (!cleanTag || tags.includes(cleanTag)) return;
    void hapticLight();
    setTags((prev) => [...prev, cleanTag]);
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    void hapticLight();
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    void hapticSuccess();
    onSave({
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      priority,
      due,
      repeat,
      tags,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      void hapticWarning();
      return;
    }
    void hapticWarning();
    onDelete(task.id);
    onClose();
  };

  const priorityOptions: {
    id: Priority;
    label: string;
    icon: typeof Flame;
    activeClass: string;
    textClass: string;
  }[] = [
    {
      id: "high",
      label: t.priorityHigh,
      icon: Flame,
      activeClass: "bg-red-950/90 border-red-600 text-red-100 shadow-sm shadow-red-950/50",
      textClass: "text-red-400",
    },
    {
      id: "medium",
      label: t.priorityMedium,
      icon: AlertCircle,
      activeClass: "bg-amber-950/90 border-amber-600 text-amber-100 shadow-sm shadow-amber-950/50",
      textClass: "text-amber-400",
    },
    {
      id: "low",
      label: t.priorityLow,
      icon: ArrowDown,
      activeClass: "bg-blue-950/90 border-blue-600 text-blue-100 shadow-sm shadow-blue-950/50",
      textClass: "text-blue-400",
    },
    {
      id: "none",
      label: t.priorityNone,
      icon: Minus,
      activeClass: "bg-zinc-800 border-zinc-500 text-zinc-100",
      textClass: "text-zinc-400",
    },
  ];

  const repeatOptions: { id: Repeat; label: string }[] = [
    { id: "none", label: t.repeatNone },
    { id: "daily", label: t.repeatDaily },
    { id: "weekly", label: t.repeatWeekly },
    { id: "monthly", label: t.repeatMonthly },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl transition-all my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Pencil className="size-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">{t.editTask}</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label={t.close} onClick={onClose}>
            <X />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-4 p-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              {t.taskTitle} <span className="text-red-400">*</span>
            </label>
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.taskTitlePlaceholder}
              className="text-base font-medium border-zinc-700/80 bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-zinc-300"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Flame className="size-3.5 text-red-400" />
              {t.priorityTitle}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {priorityOptions.map((opt) => {
                const isSelected = priority === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      void hapticLight();
                      setPriority(opt.id);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? opt.activeClass
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200",
                    )}
                  >
                    <Icon className={cn("size-3.5", isSelected ? "" : opt.textClass)} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description / Secondary Note */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              {t.taskDescription}
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.taskDescriptionPlaceholder}
              className="text-xs font-normal border-zinc-700/80 bg-zinc-900/90 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-300"
            />
          </div>

          {/* Due Date & Time */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Clock className="size-3.5 text-emerald-400" />
                {t.dueDateTitle}
              </label>
              {due && (
                <button
                  type="button"
                  onClick={() => {
                    void hapticLight();
                    setDue(null);
                  }}
                  className="text-[11px] font-medium text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  {t.clearDue}
                </button>
              )}
            </div>

            {/* Quick date presets */}
            <div className="mb-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  void hapticLight();
                  setDue(getQuickDue("today"));
                }}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs text-zinc-300 hover:border-emerald-700/60 hover:bg-emerald-950/30 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <Zap className="size-3 text-amber-400" />
                <span>{t.dueToday} (۱۸:۰۰)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void hapticLight();
                  setDue(getQuickDue("tomorrow"));
                }}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs text-zinc-300 hover:border-emerald-700/60 hover:bg-emerald-950/30 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <Calendar className="size-3 text-sky-400" />
                <span>{t.dueTomorrow} (۹:۰۰)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void hapticLight();
                  setDue(getQuickDue("weekend"));
                }}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs text-zinc-300 hover:border-emerald-700/60 hover:bg-emerald-950/30 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <CalendarDays className="size-3 text-emerald-400" />
                <span>{t.dueWeekend} (۹:۰۰)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="datetime-local"
                  value={toLocalDatetimeInput(due)}
                  onChange={(e) => setDue(fromLocalDatetimeInput(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-200 shadow-xs outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Tag className="size-3.5 text-sky-400" />
              {t.tagsTitle}
            </label>

            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const parsed = parseTag(tag);

                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-800/90 px-2 py-0.5 text-xs font-medium text-zinc-300"
                    >
                      <span className="text-zinc-500 text-[10px]">#</span>
                      {parsed.isScoped ? (
                        <span>
                          <span className="text-zinc-500 font-normal">{parsed.key}:</span>
                          <span className="text-zinc-100 font-semibold">{parsed.value}</span>
                        </span>
                      ) : (
                        <span>{tag}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ms-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Add Tag Input */}
            <div className="flex items-center gap-1.5">
              <Input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTagInput.trim()) {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
                placeholder={t.addTagPlaceholder}
                className="h-8 text-xs border-zinc-700/80 bg-zinc-900/90 placeholder:text-zinc-500"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(newTagInput)}
                disabled={!newTagInput.trim()}
                className="h-8 px-2.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>{t.tagAdd}</span>
              </Button>
            </div>

            {/* Tag suggestions */}
            {allTagPool.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-zinc-500 me-1">{t.quickAddTag}</span>
                {allTagPool.slice(0, 6).map((suggestedTag) => (
                  <button
                    key={suggestedTag}
                    type="button"
                    onClick={() => handleAddTag(suggestedTag)}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span className="text-zinc-500 text-[10px]">+</span>
                    <span>{suggestedTag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Repeat2 className="size-3.5 text-purple-400" />
              {t.recurrenceTitle}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {repeatOptions.map((opt) => {
                const isSelected = repeat === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      void hapticLight();
                      setRepeat(opt.id);
                    }}
                    className={cn(
                      "rounded-xl border py-1.5 px-2 text-center text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "border-purple-600 bg-purple-950/80 text-purple-200 shadow-xs"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 px-5 py-3.5 shrink-0 bg-zinc-950/60">
          <div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className={cn(
                "gap-1.5 text-xs font-medium transition-all",
                confirmDelete
                  ? "bg-red-600 hover:bg-red-700 text-white font-bold ring-2 ring-red-400"
                  : "bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-900/80 hover:text-red-100",
              )}
            >
              <Trash2 className="size-3.5" />
              <span>{confirmDelete ? t.deleteTaskConfirm : t.deleteTask}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-white text-black hover:bg-zinc-200 font-semibold gap-1.5"
            >
              <span>{t.saveChanges}</span>
              <Kbd
                size="xs"
                className="hidden sm:inline-flex bg-zinc-200 text-zinc-800 border-zinc-300"
              >
                ↵
              </Kbd>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
