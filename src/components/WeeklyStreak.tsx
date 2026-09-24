import { getTranslation } from "@/lib/i18n.ts";
import type { Language, Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { CheckCircle2, Flame } from "lucide-react";
import { useMemo } from "react";

interface Props {
  tasks: Task[];
  lang?: Language;
}

interface DayStats {
  date: Date;
  label: string;
  dayNum: number;
  count: number;
  isToday: boolean;
}

export function WeeklyStreak({ tasks, lang = "fa" }: Props) {
  const t = getTranslation(lang);
  const isFa = lang === "fa";

  const { days, streak, todayCompleted, todayTotal, todayPercent } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate last 7 days stats
    const dayStats: DayStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday.getTime() - i * 864e5);
      const nextD = new Date(d.getTime() + 864e5);

      const dayTasks = tasks.filter((task) => {
        if (!task.doneAt) return false;
        const doneTime = new Date(task.doneAt).getTime();
        return doneTime >= d.getTime() && doneTime < nextD.getTime();
      });

      const dayName = d.toLocaleDateString(isFa ? "fa-IR" : "en-US", { weekday: "narrow" });
      dayStats.push({
        date: d,
        label: dayName,
        dayNum: d.getDate(),
        count: dayTasks.length,
        isToday: i === 0,
      });
    }

    // Calculate consecutive streak
    let currentStreak = 0;
    const checkDays = [...dayStats].reverse();
    for (const d of checkDays) {
      if (d.count > 0) {
        currentStreak++;
      } else if (d.isToday) {
        continue;
      } else {
        break;
      }
    }

    // Today's task numbers
    const todayOpen = tasks.filter((task) => {
      if (task.done) return false;
      if (!task.due) return false;
      const dueTime = new Date(task.due).getTime();
      const endOfToday = new Date(startOfToday.getTime() + 864e5 - 1).getTime();
      return dueTime <= endOfToday;
    }).length;

    const todayDone = dayStats[dayStats.length - 1]?.count || 0;
    const total = todayDone + todayOpen;
    const percent = total > 0 ? Math.round((todayDone / total) * 100) : 0;

    return {
      days: dayStats,
      streak: currentStreak,
      todayCompleted: todayDone,
      todayTotal: total,
      todayPercent: percent,
    };
  }, [tasks, isFa]);

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        {/* Streak and Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-orange-950/60 border border-orange-800/60 px-2.5 py-1 text-xs font-semibold text-orange-300">
            <Flame className="size-3.5 text-orange-400 fill-orange-400/20" />
            <span>{t.streakDays(streak)}</span>
          </div>

          {todayTotal > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>{t.todayStats(todayCompleted, todayTotal, todayPercent)}</span>
            </div>
          )}
        </div>

        {/* 7-Day Activity Grid */}
        <div className="flex items-center gap-1.5">
          {days.map((d) => {
            const hasActivity = d.count > 0;
            return (
              <div
                key={d.date.toISOString()}
                className="flex flex-col items-center gap-1"
                title={t.dayTasksTooltip(d.label, d.count)}
              >
                <span
                  className={cn(
                    "text-[10px]",
                    d.isToday ? "text-zinc-200 font-bold" : "text-zinc-500",
                  )}
                >
                  {d.label}
                </span>
                <div
                  className={cn(
                    "size-5 rounded-md border text-[10px] font-mono grid place-items-center transition-all",
                    hasActivity
                      ? d.count >= 3
                        ? "bg-emerald-500 text-black font-bold border-emerald-400 shadow-xs shadow-emerald-500/20"
                        : "bg-emerald-950/90 text-emerald-300 border-emerald-700/80"
                      : d.isToday
                        ? "border-zinc-600 bg-zinc-800/80 text-zinc-400"
                        : "border-zinc-800/80 bg-zinc-900/60 text-zinc-600",
                  )}
                >
                  {hasActivity ? d.count : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's completion progress bar */}
      {todayTotal > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${todayPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
