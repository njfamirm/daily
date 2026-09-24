import { Header } from "@/components/Header.tsx";
import { Notes } from "@/components/Notes.tsx";
import { QuickAdd } from "@/components/QuickAdd.tsx";
import { TaskItem } from "@/components/TaskItem.tsx";
import { fireConfettiAt } from "@/lib/confetti.ts";
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from "@/lib/haptics.ts";
import { getTranslation, updateDocumentDirection } from "@/lib/i18n.ts";
import { UpdateDialog } from "@/components/UpdateDialog.tsx";
import { initNotificationChannel, syncAllTaskNotifications } from "@/lib/notifications.ts";
import { beep, notify, requestNotificationPermission, setBadge } from "@/lib/notify.ts";
import { parseInput } from "@/lib/parse.ts";
import type { DB, Language, SnoozePreset, Task } from "@/lib/types.ts";
import { useAutoCloudSync } from "@/lib/useCloudSync.ts";
import { useDB } from "@/lib/useDB.ts";
import { cn, uid } from "@/lib/utils.ts";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Flame,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SortMode = "priority" | "due" | "created";

function nextDue(iso: string, repeat: Task["repeat"], from = new Date()): string {
  const d = new Date(iso);
  let guard = 0;
  while (d.getTime() <= from.getTime() && guard++ < 500) {
    if (repeat === "daily") d.setDate(d.getDate() + 1);
    else if (repeat === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

function computeSnoozeTime(preset: SnoozePreset): string {
  const d = new Date();
  if (preset === "15m") {
    d.setMinutes(d.getMinutes() + 15);
  } else if (preset === "1h") {
    d.setHours(d.getHours() + 1);
  } else if (preset === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(8, 30, 0, 0);
  } else if (preset === "weekend") {
    const day = d.getDay(); // 0: Sun, 6: Sat
    let daysUntilSat = (6 - day + 7) % 7;
    if (daysUntilSat === 0) daysUntilSat = 7;
    d.setDate(d.getDate() + daysUntilSat);
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}

export function App() {
  const { db, setDb, update } = useDB();
  const lang: Language = db.settings.language || "fa";
  const t = getTranslation(lang);

  // Sync document direction and language attribute with active setting
  useEffect(() => {
    updateDocumentDirection(lang);
  }, [lang]);

  // Automatic real-time background cloud synchronization
  useAutoCloudSync({
    db,
    onApplyRemote: setDb,
  });

  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [showInput, setShowInput] = useState(() => {
    try {
      const saved = localStorage.getItem("daily.showInput");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const firedRef = useRef(false);

  const toggleInput = () => {
    setShowInput((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("daily.showInput", String(next));
      } catch {}
      return next;
    });
  };

  const showToast = (text: string, undo?: () => void) => {
    setToast({ text, undo });
    setTimeout(() => setToast(null), undo ? 8000 : 3000);
  };

  // Initialize native notification channel with high priority
  useEffect(() => {
    void initNotificationChannel();
  }, []);

  // Sync native device scheduled alarms with active tasks
  useEffect(() => {
    void syncAllTaskNotifications(db.tasks);
  }, [db.tasks]);

  // Periodic reminder checking engine
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      const currentTime = Date.now();
      const lead = db.settings.leadMinutes * 60_000;
      const ring: Task[] = db.tasks.filter(
        (x) =>
          !x.done &&
          !x.deletedAt &&
          x.due !== null &&
          new Date(x.due).getTime() - lead <= currentTime &&
          (x.notifiedAt === null || new Date(x.notifiedAt).getTime() < new Date(x.due).getTime()),
      );
      if (ring.length > 0) {
        if (db.settings.notifications) {
          for (const x of ring) notify(t.appName, x.title);
        }
        if (db.settings.sound) beep(ring.length > 1 ? 3 : 2);
        const ids = new Set(ring.map((x) => x.id));
        const nowIso = new Date().toISOString();
        update((prev) => ({
          ...prev,
          tasks: prev.tasks.map((x) =>
            ids.has(x.id) ? { ...x, notifiedAt: nowIso, updatedAt: nowIso } : x,
          ),
        }));
      }
    };
    tick();
    const id = setInterval(tick, db.settings.checkIntervalSec * 1000);
    return () => clearInterval(id);
  }, [db, update, t.appName]);

  const due = useMemo(
    () =>
      db.tasks.filter(
        (t) => !t.done && !t.deletedAt && t.due !== null && new Date(t.due).getTime() <= now,
      ).length,
    [db.tasks, now],
  );

  useEffect(() => {
    setBadge(due);
  }, [due]);

  // Request notification permission on first user gesture
  useEffect(() => {
    const ask = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      if (db.settings.notifications) void requestNotificationPermission();
    };
    window.addEventListener("pointerdown", ask, { once: true });
    window.addEventListener("keydown", ask, { once: true });
    return () => {
      window.removeEventListener("pointerdown", ask);
      window.removeEventListener("keydown", ask);
    };
  }, [db.settings.notifications]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !isInputActive) {
        if (toast?.undo) {
          e.preventDefault();
          toast.undo();
          setToast(null);
        }
        return;
      }

      if (isInputActive) return;

      // Quick add focus: '/' or 'n' or 'N'
      if (e.key === "/" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowInput(true);
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>("#quick-add-input");
          input?.focus();
        }, 50);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toast]);

  const addTask = (raw: string) => {
    const p = parseInput(raw);
    if (!p.title) return;
    void hapticLight();
    const nowIso = new Date().toISOString();
    const task: Task = {
      id: uid(),
      title: p.title,
      description: p.description || null,
      due: p.due ? p.due.toISOString() : null,
      repeat: p.repeat,
      priority: p.priority,
      done: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      doneAt: null,
      deletedAt: null,
      notifiedAt: null,
      tags: p.tags,
    };
    update((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
  };

  const toggle = (id: string, event?: React.MouseEvent) =>
    update((prev) => {
      const target = prev.tasks.find((t) => t.id === id);
      if (target && !target.done) {
        fireConfettiAt(event);
        void hapticSuccess();
      } else {
        void hapticLight();
      }
      const nowIso = new Date().toISOString();
      return {
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== id) return t;
          // Recurring task advances to the next period instead of closing
          if (!t.done && t.repeat !== "none" && t.due) {
            return {
              ...t,
              due: nextDue(t.due, t.repeat),
              notifiedAt: null,
              updatedAt: nowIso,
            };
          }
          return {
            ...t,
            done: !t.done,
            doneAt: t.done ? null : nowIso,
            updatedAt: nowIso,
          };
        }),
      };
    });

  const remove = (id: string) => {
    void hapticWarning();
    const before = db;
    const nowIso = new Date().toISOString();
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, deletedAt: nowIso, updatedAt: nowIso } : t,
      ),
    }));
    showToast(t.deleted, () => setDb(before));
  };

  const snooze = (id: string, preset: SnoozePreset) => {
    void hapticMedium();
    const before = db;
    const targetIso = computeSnoozeTime(preset);
    const nowIso = new Date().toISOString();
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? { ...t, due: targetIso, notifiedAt: null, done: false, updatedAt: nowIso }
          : t,
      ),
    }));
    const label =
      preset === "15m"
        ? t.snooze15m
        : preset === "1h"
          ? t.snooze1h
          : preset === "tomorrow"
            ? t.snoozeTomorrow
            : t.snoozeWeekend;
    showToast(t.snoozedToast(label), () => setDb(before));
  };

  const rename = (id: string, title: string, description?: string | null) => {
    const nowIso = new Date().toISOString();
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              title: title.trim() || t.title,
              description: description !== undefined ? description : t.description,
              updatedAt: nowIso,
            }
          : t,
      ),
    }));
  };

  const clearDone = () => {
    void hapticWarning();
    const before = db;
    const nowIso = new Date().toISOString();
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.done && !t.deletedAt ? { ...t, deletedAt: nowIso, updatedAt: nowIso } : t,
      ),
    }));
    showToast(t.clearDoneSuccess, () => setDb(before));
  };

  const [sortBy, setSortBy] = useState<SortMode>(() => {
    try {
      const saved = localStorage.getItem("daily.sortBy") as SortMode | null;
      if (saved === "priority" || saved === "due" || saved === "created") return saved;
    } catch {}
    return "priority";
  });

  const handleSetSortBy = (mode: SortMode) => {
    void hapticLight();
    setSortBy(mode);
    try {
      localStorage.setItem("daily.sortBy", mode);
    } catch {}
  };

  const sortOptions = useMemo(
    () => [
      { id: "priority" as const, label: t.sortPriority, icon: Flame, iconColor: "text-red-400" },
      { id: "due" as const, label: t.sortDue, icon: Clock, iconColor: "text-emerald-400" },
      { id: "created" as const, label: t.sortCreated, icon: Sparkles, iconColor: "text-sky-400" },
    ],
    [t.sortPriority, t.sortDue, t.sortCreated],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of db.tasks) {
      if (t.deletedAt) continue;
      for (const tag of t.tags || []) {
        if (tag.trim()) set.add(tag.trim());
      }
    }
    return Array.from(set);
  }, [db.tasks]);

  const groups = useMemo(() => {
    const open = db.tasks.filter((t) => !t.done && !t.deletedAt);
    const ts = (t: Task) => (t.due ? new Date(t.due).getTime() : Infinity);

    if (sortBy === "priority") {
      const sortTasks = (a: Task, b: Task) => {
        const pWeight = { high: 0, medium: 1, none: 2, low: 3 };
        const aP = pWeight[a.priority || "none"];
        const bP = pWeight[b.priority || "none"];
        if (aP !== bP) return aP - bP;

        const aOverdue = a.due && ts(a) <= now ? 0 : 1;
        const bOverdue = b.due && ts(b) <= now ? 0 : 1;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;

        const timeDiff = ts(a) - ts(b);
        if (timeDiff !== 0) return timeDiff;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      };

      const highPriority = open.filter((t) => t.priority === "high").sort(sortTasks);
      const regularTasks = open.filter((t) => t.priority !== "high").sort(sortTasks);
      const done = db.tasks.filter((t) => t.done && !t.deletedAt).slice(0, 25);

      return {
        mode: "priority" as const,
        highPriority,
        regularTasks,
        done,
      };
    }

    if (sortBy === "due") {
      const overdue = open
        .filter((t) => t.due !== null && ts(t) <= now)
        .sort((a, b) => ts(a) - ts(b));

      const upcoming = open
        .filter((t) => t.due !== null && ts(t) > now)
        .sort((a, b) => ts(a) - ts(b));

      const noDue = open
        .filter((t) => t.due === null)
        .sort((a, b) => {
          const pWeight = { high: 0, medium: 1, none: 2, low: 3 };
          return pWeight[a.priority || "none"] - pWeight[b.priority || "none"];
        });

      const done = db.tasks.filter((t) => t.done && !t.deletedAt).slice(0, 25);

      return {
        mode: "due" as const,
        overdue,
        upcoming,
        noDue,
        done,
      };
    }

    const createdTasks = [...open].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const done = db.tasks.filter((t) => t.done && !t.deletedAt).slice(0, 25);

    return {
      mode: "created" as const,
      createdTasks,
      done,
    };
  }, [db.tasks, now, sortBy]);

  const setSetting = <K extends keyof DB["settings"]>(k: K, v: DB["settings"][K]) =>
    update((prev) => ({ ...prev, settings: { ...prev.settings, [k]: v } }));

  const activeTasksCount = db.tasks.filter((t) => !t.deletedAt).length;
  const openCount = db.tasks.filter((t) => !t.done && !t.deletedAt).length;

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:py-10">
      <Header
        db={db}
        lang={lang}
        dueCount={due}
        showInput={showInput}
        onToggleInput={toggleInput}
        onReplace={setDb}
        onUpdateMemory={(aiMemory) => update((prev) => ({ ...prev, aiMemory }))}
        onUpdateSetting={setSetting}
        onClearDone={clearDone}
        onMessage={showToast}
      />

      {showInput && <QuickAdd onAdd={addTask} existingTags={allTags} lang={lang} />}

      <Notes
        notes={db.notes.filter((n) => !n.deletedAt)}
        lang={lang}
        onAdd={(text) => {
          const nowIso = new Date().toISOString();
          update((prev) => ({
            ...prev,
            notes: [
              ...prev.notes,
              { id: uid(), text, createdAt: nowIso, updatedAt: nowIso, deletedAt: null },
            ],
          }));
        }}
        onRemove={(id) => {
          const nowIso = new Date().toISOString();
          update((prev) => ({
            ...prev,
            notes: prev.notes.map((n) =>
              n.id === id ? { ...n, deletedAt: nowIso, updatedAt: nowIso } : n,
            ),
          }));
        }}
      />

      <main className="flex-1 space-y-6">
        {activeTasksCount > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-zinc-400">{t.openTasksCount(openCount)}</span>
            <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 text-xs shadow-xs">
              {sortOptions.map((opt) => {
                const active = sortBy === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSetSortBy(opt.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                      active
                        ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
                    )}
                  >
                    <Icon className={cn("size-3.5", active ? opt.iconColor : "text-zinc-500")} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {groups.mode === "priority" && (
          <>
            <Group
              title={t.groupUrgent}
              icon={<Flame className="size-4 text-red-500 fill-red-500/20" />}
              tasks={groups.highPriority}
              alert
              lang={lang}
              onSnooze={snooze}
              {...{ toggle, remove, rename }}
            />
            <Group
              title={t.groupRegular}
              icon={<CheckSquare className="size-4 text-zinc-400" />}
              tasks={groups.regularTasks}
              lang={lang}
              onSnooze={snooze}
              {...{ toggle, remove, rename }}
            />
          </>
        )}

        {groups.mode === "due" && (
          <>
            <Group
              title={t.groupOverdue}
              icon={<AlertCircle className="size-4 text-red-500" />}
              tasks={groups.overdue}
              alert
              lang={lang}
              onSnooze={snooze}
              {...{ toggle, remove, rename }}
            />
            <Group
              title={t.groupUpcoming}
              icon={<Calendar className="size-4 text-emerald-400" />}
              tasks={groups.upcoming}
              lang={lang}
              onSnooze={snooze}
              {...{ toggle, remove, rename }}
            />
            <Group
              title={t.groupNoDue}
              icon={<Clock className="size-4 text-zinc-400" />}
              tasks={groups.noDue}
              lang={lang}
              onSnooze={snooze}
              {...{ toggle, remove, rename }}
            />
          </>
        )}

        {groups.mode === "created" && (
          <Group
            title={t.groupCreated}
            icon={<Sparkles className="size-4 text-sky-400" />}
            tasks={groups.createdTasks}
            lang={lang}
            onSnooze={snooze}
            {...{ toggle, remove, rename }}
          />
        )}

        <Group
          title={t.groupDone}
          icon={<CheckCircle2 className="size-4 text-emerald-400" />}
          tasks={groups.done}
          lang={lang}
          {...{ toggle, remove, rename }}
        />

        {activeTasksCount === 0 && (
          <p className="pt-10 text-center text-sm text-zinc-500">{t.emptyTasksMsg}</p>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-2xl backdrop-blur-md">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              className="font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300 cursor-pointer"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              {t.undo}
            </button>
          )}
        </div>
      )}

      {/* In-app native auto updater dialog */}
      <UpdateDialog lang={lang} />
    </div>
  );
}

function Group({
  title,
  icon,
  tasks,
  alert,
  lang,
  toggle,
  remove,
  rename,
  onSnooze,
}: {
  title: string;
  icon?: React.ReactNode;
  tasks: Task[];
  alert?: boolean;
  lang: Language;
  toggle: (id: string, event?: React.MouseEvent) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string, description?: string | null) => void;
  onSnooze?: (id: string, preset: SnoozePreset) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2
        className={cn(
          "mb-2 flex items-center justify-between px-2 text-xs font-semibold text-zinc-400",
          alert && "text-red-400 font-bold",
        )}
      >
        <span className="flex items-center gap-1.5">
          {icon}
          <span>{title}</span>
        </span>
        <span
          className={cn(
            "rounded-full bg-zinc-800/80 px-2 py-0.5 text-[11px] font-mono text-zinc-300",
            alert && "border border-red-800/50 bg-red-950/80 text-red-300",
          )}
        >
          {tasks.length}
        </span>
      </h2>
      <div className="space-y-1.5">
        {tasks.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            lang={lang}
            onToggle={toggle}
            onDelete={remove}
            onRename={rename}
            onSnooze={onSnooze}
          />
        ))}
      </div>
    </section>
  );
}
