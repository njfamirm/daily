import { Button } from "@/components/ui/button.tsx";
import {
  ALARM_SOUND_THEMES,
  type AlarmSoundTheme,
  playAlarmSound,
  setAlarmTheme,
} from "@/lib/alarmAudio.ts";
import { getTranslation } from "@/lib/i18n.ts";
import type { Language } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { AlarmClock, Check, Music, Play, Radio, Sparkles, Volume2, X } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  currentTheme?: AlarmSoundTheme;
  lang?: Language;
  onSelectTheme: (theme: AlarmSoundTheme) => void;
  onClose: () => void;
}

function ThemeIcon({ icon }: { icon: "music" | "radio" | "sparkles" | "alarm-clock" }) {
  switch (icon) {
    case "music":
      return <Music className="size-5 text-amber-400" />;
    case "radio":
      return <Radio className="size-5 text-sky-400" />;
    case "sparkles":
      return <Sparkles className="size-5 text-violet-400" />;
    case "alarm-clock":
      return <AlarmClock className="size-5 text-emerald-400" />;
    default:
      return <Music className="size-5 text-amber-400" />;
  }
}

export function AlarmSoundModal({
  open,
  currentTheme = "marimba",
  lang = "fa",
  onSelectTheme,
  onClose,
}: Props) {
  const [playingId, setPlayingId] = useState<AlarmSoundTheme | null>(null);
  const t = getTranslation(lang);
  const isFa = lang === "fa";

  if (!open) return null;

  const handlePreview = (theme: AlarmSoundTheme) => {
    setPlayingId(theme);
    playAlarmSound(theme);
    setTimeout(() => {
      setPlayingId((prev) => (prev === theme ? null : prev));
    }, 1200);
  };

  const handleChoose = (theme: AlarmSoundTheme) => {
    setAlarmTheme(theme);
    onSelectTheme(theme);
    handlePreview(theme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Music className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isFa ? "انتخاب صدای زنگ آلارم" : "Alarm Sound Themes"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isFa ? "آواهای باکیفیت ساخته‌شده با Web Audio" : "Synthesized high-fidelity tones"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Theme List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {ALARM_SOUND_THEMES.map((theme) => {
            const isSelected = currentTheme === theme.id;
            const isPlaying = playingId === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => handleChoose(theme.id)}
                className={cn(
                  "group relative flex items-center justify-between gap-3 rounded-xl border p-3 transition-all cursor-pointer",
                  isSelected
                    ? "border-amber-500/60 bg-amber-950/20 shadow-md shadow-amber-950/30"
                    : "border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/70",
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="grid size-9 place-items-center rounded-xl bg-zinc-800/80 border border-zinc-700/60 shrink-0">
                    <ThemeIcon icon={theme.icon} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {isFa ? theme.titleFa : theme.titleEn}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.2 text-[10px] font-semibold text-amber-300">
                          <Check className="size-2.5" />
                          {isFa ? "انتخاب شده" : "Active"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                      {isFa ? theme.descFa : theme.descEn}
                    </p>
                  </div>
                </div>

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(theme.id);
                  }}
                  title={isFa ? "پخش نمونه صدا" : "Preview sound"}
                  className={cn(
                    "shrink-0 grid size-8 place-items-center rounded-lg border transition-all cursor-pointer",
                    isPlaying
                      ? "bg-amber-500 text-zinc-950 border-amber-400 scale-105"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white",
                  )}
                >
                  {isPlaying ? (
                    <Volume2 className="size-4 animate-pulse" />
                  ) : (
                    <Play className="size-3.5 fill-current" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
          <p className="text-[10px] text-zinc-500">
            {isFa ? "روی هر گزینه کلیک کنید تا تست شود" : "Click to preview and select"}
          </p>
          <Button size="sm" onClick={onClose} className="text-xs font-semibold px-4">
            {t.apply || "تأیید"}
          </Button>
        </div>
      </div>
    </div>
  );
}
