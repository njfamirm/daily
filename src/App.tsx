import { HelpSheet } from "@/components/HelpSheet.tsx";
import { Notes } from "@/components/Notes.tsx";
import { QuickAdd } from "@/components/QuickAdd.tsx";
import { SyncBar } from "@/components/SyncBar.tsx";
import { TaskItem } from "@/components/TaskItem.tsx";
import { Button } from "@/components/ui/button.tsx";
import { beep, notify, requestNotificationPermission, setBadge } from "@/lib/notify.ts";
import { parseInput } from "@/lib/parse.ts";
import type { DB, Task } from "@/lib/types.ts";
import { useDB } from "@/lib/useDB.ts";
import { cn, uid } from "@/lib/utils.ts";
import { Bell, BellOff, HelpCircle, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function nextDue(iso: string, repeat: Task["repeat"], from = new Date()): string {
  const d = new Date(iso);
  // جلو می‌بریم تا اولین موعدِ آینده
  let guard = 0;
  while (d.getTime() <= from.getTime() && guard++ < 500) {
    if (repeat === "daily") d.setDate(d.getDate() + 1);
    else if (repeat === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

export function App() {
  const { db, setDb, update } = useDB();
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const firedRef = useRef(false);

  const showToast = (text: string, undo?: () => void) => {
    setToast({ text, undo });
    setTimeout(() => setToast(null), undo ? 8000 : 3000);
  };

  // موتور یادآوری
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      const t = Date.now();
      const lead = db.settings.leadMinutes * 60_000;
      const ring: Task[] = db.tasks.filter(
        (x) =>
          !x.done &&
          x.due !== null &&
          new Date(x.due).getTime() - lead <= t &&
          (x.notifiedAt === null || new Date(x.notifiedAt).getTime() < new Date(x.due).getTime()),
      );
      if (ring.length > 0) {
        if (db.settings.notifications) {
          for (const x of ring) notify("یادت نره", x.title);
        }
        if (db.settings.sound) beep(ring.length > 1 ? 3 : 2);
        const ids = new Set(ring.map((x) => x.id));
        update((prev) => ({
          ...prev,
          tasks: prev.tasks.map((x) =>
            ids.has(x.id) ? { ...x, notifiedAt: new Date().toISOString() } : x,
          ),
        }));
      }
    };
    tick();
    const id = setInterval(tick, db.settings.checkIntervalSec * 1000);
    return () => clearInterval(id);
  }, [db, update]);

  const due = useMemo(
    () =>
      db.tasks.filter((t) => !t.done && t.due !== null && new Date(t.due).getTime() <= now).length,
    [db.tasks, now],
  );

  useEffect(() => {
    setBadge(due);
  }, [due]);

  // درخواست مجوز نوتیف در اولین تعامل کاربر
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

  // کلیدهای میانبر سراسری کیبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Undo: Ctrl+Z یا Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !isInputActive) {
        if (toast?.undo) {
          e.preventDefault();
          toast.undo();
          setToast(null);
        }
        return;
      }

      // Escape برای بستن مدال راهنما یا لغو فیلتر تگ
      if (e.key === "Escape") {
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        if (selectedTag) {
          setSelectedTag(null);
          return;
        }
      }

      // هنگام تایپ داخل input یا textarea کلیدهای ناوبری فعال نشوند
      if (isInputActive) return;

      // فوکوس ثبت سریع: '/' یا 'n' یا 'N'
      if (e.key === "/" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>("#quick-add-input");
        input?.focus();
        return;
      }

      // راهنما: '?' یا 'Shift+/'
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      // قطع و وصل صدا: 's' یا 'S'
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSetting("sound", !db.settings.sound);
        showToast(!db.settings.sound ? "صدای زنگ فعال شد" : "صدای زنگ خاموش شد");
        return;
      }

      // قطع و وصل نوتیفیکیشن: 'b' یا 'B'
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        const next = !db.settings.notifications;
        setSetting("notifications", next);
        if (next) void requestNotificationPermission();
        showToast(next ? "نوتیفیکیشن فعال شد" : "نوتیفیکیشن غیرفعال شد");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [db.settings.sound, db.settings.notifications, helpOpen, selectedTag, toast]);

  const addTask = (raw: string) => {
    const p = parseInput(raw);
    if (!p.title) return;
    const task: Task = {
      id: uid(),
      title: p.title,
      due: p.due ? p.due.toISOString() : null,
      repeat: p.repeat,
      priority: p.priority,
      done: false,
      createdAt: new Date().toISOString(),
      doneAt: null,
      notifiedAt: null,
      tags: p.tags,
    };
    update((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
  };

  const toggle = (id: string) =>
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        // تسک تکرارشونده به‌جای بسته‌شدن، به موعد بعدی می‌رود
        if (!t.done && t.repeat !== "none" && t.due) {
          return { ...t, due: nextDue(t.due, t.repeat), notifiedAt: null };
        }
        return {
          ...t,
          done: !t.done,
          doneAt: t.done ? null : new Date().toISOString(),
        };
      }),
    }));

  const remove = (id: string) => {
    const before = db;
    update((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
    showToast("حذف شد", () => setDb(before));
  };

  const rename = (id: string, title: string) =>
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, title: title.trim() || t.title } : t)),
    }));

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of db.tasks) {
      for (const tag of t.tags) set.add(tag);
    }
    return Array.from(set);
  }, [db.tasks]);

  const groups = useMemo(() => {
    const filtered = selectedTag ? db.tasks.filter((t) => t.tags.includes(selectedTag)) : db.tasks;
    const open = filtered.filter((t) => !t.done);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const ts = (t: Task) => (t.due ? new Date(t.due).getTime() : Infinity);
    const byDue = (a: Task, b: Task) => {
      // تسک‌های با اولویت بالا در صورت تاریخ برابر یا بدون تاریخ بالاتر قرار می‌گیرند
      const pWeight = { high: 0, medium: 1, low: 2, none: 3 };
      const timeDiff = ts(a) - ts(b);
      if (timeDiff === 0 || (!a.due && !b.due)) {
        return pWeight[a.priority || "none"] - pWeight[b.priority || "none"];
      }
      return timeDiff;
    };
    return {
      overdue: open.filter((t) => t.due && ts(t) <= now).sort(byDue),
      today: open.filter((t) => t.due && ts(t) > now && ts(t) <= endOfToday.getTime()).sort(byDue),
      later: open.filter((t) => t.due && ts(t) > endOfToday.getTime()).sort(byDue),
      someday: open.filter((t) => !t.due).sort(byDue),
      done: filtered.filter((t) => t.done).slice(0, 20),
    };
  }, [db.tasks, now, selectedTag]);

  const setSetting = <K extends keyof DB["settings"]>(k: K, v: DB["settings"][K]) =>
    update((prev) => ({ ...prev, settings: { ...prev.settings, [k]: v } }));

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-14">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-tight text-white">daily</h1>
          {due > 0 && (
            <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300">
              {due} سررسیدشده
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SyncBar
            db={db}
            onReplace={setDb}
            onUpdateMemory={(aiMemory) => update((prev) => ({ ...prev, aiMemory }))}
            onMessage={showToast}
          />

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="راهنما"
              title="راهنما و کلیدهای میانبر (؟)"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="صدا"
              title={db.settings.sound ? "صدا روشن (S)" : "صدا خاموش (S)"}
              onClick={() => setSetting("sound", !db.settings.sound)}
            >
              {db.settings.sound ? (
                <Volume2 className="text-zinc-200" />
              ) : (
                <VolumeX className="text-zinc-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="نوتیفیکیشن"
              title={db.settings.notifications ? "نوتیف روشن (B)" : "نوتیف خاموش (B)"}
              onClick={() => {
                const next = !db.settings.notifications;
                setSetting("notifications", next);
                if (next) void requestNotificationPermission();
              }}
            >
              {db.settings.notifications ? (
                <Bell className="text-zinc-200" />
              ) : (
                <BellOff className="text-zinc-500" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <QuickAdd onAdd={addTask} />

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 py-0.5 text-xs">
          <span className="text-zinc-500 text-[11px]">فیلتر برچسب:</span>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                type="button"
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={cn(
                  "rounded-md border px-2 py-0.5 font-medium transition-all cursor-pointer text-[11px]",
                  isSelected
                    ? "border-white bg-white text-black font-semibold shadow-xs"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                )}
              >
                #{tag}
              </button>
            );
          })}
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="text-[11px] font-medium text-amber-400 underline underline-offset-2 hover:text-amber-300 ms-1 cursor-pointer"
            >
              نمایش همه
            </button>
          )}
        </div>
      )}

      <Notes
        notes={db.notes}
        onAdd={(text) =>
          update((prev) => ({
            ...prev,
            notes: [...prev.notes, { id: uid(), text, createdAt: new Date().toISOString() }],
          }))
        }
        onRemove={(id) =>
          update((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }))
        }
      />

      <main className="flex-1 space-y-6">
        <Group
          title="سررسید شده"
          tasks={groups.overdue}
          alert
          onTagClick={(tag) => setSelectedTag(selectedTag === tag ? null : tag)}
          {...{ toggle, remove, rename }}
        />
        <Group
          title="امروز"
          tasks={groups.today}
          onTagClick={(tag) => setSelectedTag(selectedTag === tag ? null : tag)}
          {...{ toggle, remove, rename }}
        />
        <Group
          title="بعداً"
          tasks={groups.later}
          onTagClick={(tag) => setSelectedTag(selectedTag === tag ? null : tag)}
          {...{ toggle, remove, rename }}
        />
        <Group
          title="بدون زمان"
          tasks={groups.someday}
          onTagClick={(tag) => setSelectedTag(selectedTag === tag ? null : tag)}
          {...{ toggle, remove, rename }}
        />
        <Group
          title="انجام‌شده"
          tasks={groups.done}
          onTagClick={(tag) => setSelectedTag(selectedTag === tag ? null : tag)}
          {...{ toggle, remove, rename }}
        />
        {db.tasks.length === 0 && (
          <p className="pt-10 text-center text-sm text-zinc-500">
            یه خط بنویس و Enter بزن. مثلاً «فردا ساعت ۹ جلسه با تیم !فوری #کار».
          </p>
        )}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
        <SyncBar
          db={db}
          onReplace={setDb}
          onUpdateMemory={(aiMemory) => update((prev) => ({ ...prev, aiMemory }))}
          onMessage={showToast}
        />
        <span className="text-xs text-zinc-400">همه‌چیز آفلاین روی مرورگر شما ذخیره می‌شود.</span>
      </footer>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-2xl backdrop-blur-md">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              className="font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              برگردان (Ctrl+Z)
            </button>
          )}
        </div>
      )}

      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function Group({
  title,
  tasks,
  alert,
  toggle,
  remove,
  rename,
  onTagClick,
}: {
  title: string;
  tasks: Task[];
  alert?: boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
  onTagClick?: (tag: string) => void;
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
        <span>{title}</span>
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
            onToggle={toggle}
            onDelete={remove}
            onRename={rename}
            onTagClick={onTagClick}
          />
        ))}
      </div>
    </section>
  );
}
