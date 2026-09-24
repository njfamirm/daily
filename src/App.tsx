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
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
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

  const addTask = (raw: string) => {
    const p = parseInput(raw);
    if (!p.title) return;
    const task: Task = {
      id: uid(),
      title: p.title,
      due: p.due ? p.due.toISOString() : null,
      repeat: p.repeat,
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

  const groups = useMemo(() => {
    const open = db.tasks.filter((t) => !t.done);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const ts = (t: Task) => (t.due ? new Date(t.due).getTime() : Infinity);
    const byDue = (a: Task, b: Task) => ts(a) - ts(b);
    return {
      overdue: open.filter((t) => t.due && ts(t) <= now).sort(byDue),
      today: open.filter((t) => t.due && ts(t) > now && ts(t) <= endOfToday.getTime()).sort(byDue),
      later: open.filter((t) => t.due && ts(t) > endOfToday.getTime()).sort(byDue),
      someday: open.filter((t) => !t.due),
      done: db.tasks.filter((t) => t.done).slice(0, 20),
    };
  }, [db.tasks, now]);

  const setSetting = <K extends keyof DB["settings"]>(k: K, v: DB["settings"][K]) =>
    update((prev) => ({ ...prev, settings: { ...prev.settings, [k]: v } }));

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-14">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight">daily</h1>
          {due > 0 && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
              {due} سررسیدشده
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="صدا"
            title={db.settings.sound ? "صدا روشن" : "صدا خاموش"}
            onClick={() => setSetting("sound", !db.settings.sound)}
          >
            {db.settings.sound ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="نوتیفیکیشن"
            title={db.settings.notifications ? "نوتیف روشن" : "نوتیف خاموش"}
            onClick={() => {
              const next = !db.settings.notifications;
              setSetting("notifications", next);
              if (next) void requestNotificationPermission();
            }}
          >
            {db.settings.notifications ? <Bell /> : <BellOff />}
          </Button>
        </div>
      </header>

      <QuickAdd onAdd={addTask} />

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
        <Group title="سررسید شده" tasks={groups.overdue} alert {...{ toggle, remove, rename }} />
        <Group title="امروز" tasks={groups.today} {...{ toggle, remove, rename }} />
        <Group title="بعداً" tasks={groups.later} {...{ toggle, remove, rename }} />
        <Group title="بدون زمان" tasks={groups.someday} {...{ toggle, remove, rename }} />
        <Group title="انجام‌شده" tasks={groups.done} {...{ toggle, remove, rename }} />
        {db.tasks.length === 0 && (
          <p className="pt-10 text-center text-sm text-neutral-600">
            یه خط بنویس و Enter بزن. مثلاً «فردا ساعت ۹ چک کن آپدیت اومده».
          </p>
        )}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-900 pt-4">
        <SyncBar db={db} onReplace={setDb} onMessage={showToast} />
        <span className="text-[11px] text-neutral-700">
          همه‌چیز فقط روی همین مرورگر ذخیره می‌شود.
        </span>
      </footer>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm shadow-xl">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              className="font-medium text-neutral-400 underline underline-offset-2 hover:text-white"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              برگردان
            </button>
          )}
        </div>
      )}
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
}: {
  title: string;
  tasks: Task[];
  alert?: boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2 className={cn("mb-1 px-3 text-xs font-medium text-neutral-500", alert && "text-red-400")}>
        {title}
        <span className="ms-2 text-neutral-700">{tasks.length}</span>
      </h2>
      <div className="space-y-0.5">
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} onToggle={toggle} onDelete={remove} onRename={rename} />
        ))}
      </div>
    </section>
  );
}
