import { Button } from "@/components/ui/button.tsx";
import { type AlarmSoundTheme, startAlarmRing, stopAlarmRing } from "@/lib/alarmAudio.ts";
import { getTranslation } from "@/lib/i18n.ts";
import { formatDue } from "@/lib/parse.ts";
import { getTagStyle, parseTag } from "@/lib/tags.ts";
import type { Language, SnoozePreset, Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { AlarmClock, BellRing, Check, Flame, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  tasks: Task[];
  lang?: Language;
  soundEnabled?: boolean;
  soundTheme?: AlarmSoundTheme;
  onDismiss: (taskIds: string[]) => void;
  onDone: (taskId: string) => void;
  onSnooze: (taskId: string, preset: SnoozePreset) => void;
}

export function AlarmModal({
  tasks,
  lang = "fa",
  soundEnabled = true,
  soundTheme,
  onDismiss,
  onDone,
  onSnooze,
}: Props) {
  const t = getTranslation(lang);
  const [snoozeMenuTaskId, setSnoozeMenuTaskId] = useState<string | null>(null);

  // Manage continuous alarm chime and vibration loop
  useEffect(() => {
    if (tasks.length > 0) {
      if (soundEnabled) {
        startAlarmRing(soundTheme);
      }
    } else {
      stopAlarmRing();
    }
    return () => {
      stopAlarmRing();
    };
  }, [tasks.length, soundEnabled, soundTheme]);

  if (tasks.length === 0) return null;

  const currentTask = tasks[0];
  const priority = currentTask.priority || "none";

  const handleDismissAll = () => {
    stopAlarmRing();
    onDismiss(tasks.map((t) => t.id));
  };

  const handleDone = (id: string) => {
    stopAlarmRing();
    onDone(id);
  };

  const handleSnooze = (id: string, preset: SnoozePreset) => {
    stopAlarmRing();
    setSnoozeMenuTaskId(null);
    onSnooze(id, preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-zinc-950/98 p-6 pt-[calc(2rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header: Ringing Status & Dismiss All */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative grid size-10 place-items-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            <BellRing className="size-5 animate-bounce" />
            <span className="absolute -top-1 -end-1 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-red-500" />
            </span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">{t.alarmRingingTitle}</h2>
            <p className="text-xs text-zinc-400">{t.alarmRingingSubtitle}</p>
          </div>
        </div>

        {tasks.length > 1 && (
          <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300">
            {tasks.length} تسک
          </span>
        )}
      </div>

      {/* Center: Main Ringing Task Details */}
      <div className="my-auto mx-auto w-full max-w-lg space-y-5 text-center">
        {/* Glowing Pulsing Icon Ring */}
        <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500/20 via-red-500/30 to-orange-500/20 p-2 shadow-2xl shadow-red-950/50">
          <div className="flex size-full items-center justify-center rounded-full border-2 border-amber-400/60 bg-zinc-900/90">
            <AlarmClock className="size-10 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Task Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {priority === "high" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-700 bg-red-950/80 px-2.5 py-0.5 text-xs font-bold text-red-200">
                <Flame className="size-3.5 text-red-400" />
                {t.priorityHigh}
              </span>
            )}
            {priority === "medium" && (
              <span className="inline-flex items-center rounded-md border border-amber-800 bg-amber-950/80 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                {t.priorityMedium}
              </span>
            )}
            {currentTask.due && (
              <span className="rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-200 border border-zinc-700">
                {formatDue(currentTask.due, lang)}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight px-2">
            {currentTask.title}
          </h1>

          {currentTask.description && (
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-md mx-auto">
              {currentTask.description}
            </p>
          )}

          {/* Tags */}
          {currentTask.tags && currentTask.tags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {currentTask.tags.map((tag) => {
                const style = getTagStyle(tag);
                const parsed = parseTag(tag);

                return (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center rounded-lg border text-xs font-medium overflow-hidden",
                      style.bg,
                      style.text,
                      style.border,
                    )}
                  >
                    {parsed.isScoped ? (
                      <>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-mono",
                            style.keyBg || "bg-black/30",
                          )}
                        >
                          {parsed.key}
                        </span>
                        <span className="pe-2 ps-1.5 py-0.5 font-medium">{parsed.value}</span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1">
                        <span className={cn("size-1.5 rounded-full", style.dot)} />#{tag}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="mx-auto w-full max-w-lg space-y-3">
        {/* Snooze Presets Drawer / Overlay if open */}
        {snoozeMenuTaskId === currentTask.id ? (
          <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-150">
            <div className="flex items-center justify-between pb-1 px-1 border-b border-zinc-800 text-xs font-medium text-zinc-400">
              <span>{t.snoozeTo}</span>
              <button
                type="button"
                onClick={() => setSnoozeMenuTaskId(null)}
                className="rounded p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => handleSnooze(currentTask.id, "15m")}
                className="border-zinc-700 bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700 py-3 text-sm font-semibold"
              >
                {t.alarmSnooze15m}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSnooze(currentTask.id, "1h")}
                className="border-zinc-700 bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700 py-3 text-sm font-semibold"
              >
                {t.alarmSnooze1h}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSnooze(currentTask.id, "tomorrow")}
                className="border-zinc-700 bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700 py-3 text-sm font-semibold"
              >
                {t.alarmSnoozeTomorrow}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSnooze(currentTask.id, "weekend")}
                className="border-zinc-700 bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700 py-3 text-sm font-semibold"
              >
                {t.alarmSnoozeWeekend}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Snooze Button */}
            <Button
              variant="outline"
              onClick={() => setSnoozeMenuTaskId(currentTask.id)}
              className="h-14 flex-col gap-1 rounded-2xl border-amber-700/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 hover:text-white shadow-lg text-xs sm:text-sm font-bold"
            >
              <AlarmClock className="size-5" />
              <span>{t.alarmSnooze}</span>
            </Button>

            {/* Mark Done Button */}
            <Button
              variant="default"
              onClick={() => handleDone(currentTask.id)}
              className="h-14 flex-col gap-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 text-xs sm:text-sm font-bold"
            >
              <Check className="size-5" strokeWidth={3} />
              <span>{t.alarmMarkDone}</span>
            </Button>

            {/* Dismiss Alarm Button */}
            <Button
              variant="outline"
              onClick={() => onDismiss([currentTask.id])}
              className="h-14 flex-col gap-1 rounded-2xl border-red-800/80 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white shadow-lg text-xs sm:text-sm font-bold"
            >
              <X className="size-5" />
              <span>{t.alarmDismiss}</span>
            </Button>
          </div>
        )}

        {tasks.length > 1 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleDismissAll}
              className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
            >
              قطع صدای همه ({tasks.length} تسک)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
