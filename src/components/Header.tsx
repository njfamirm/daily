import { AIMemorySheet } from "@/components/AIMemorySheet.tsx";
import { AlarmSoundModal } from "@/components/AlarmSoundModal.tsx";
import { DailyDigestModal } from "@/components/DailyDigestModal.tsx";
import { HelpSheet } from "@/components/HelpSheet.tsx";
import { StreakModal } from "@/components/StreakModal.tsx";
import { SyncModal } from "@/components/SyncModal.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/input.tsx";
import { Kbd } from "@/components/ui/kbd.tsx";
import { ALARM_SOUND_THEMES } from "@/lib/alarmAudio.ts";
import { getTranslation } from "@/lib/i18n.ts";
import { requestNotificationPermission } from "@/lib/notify.ts";
import { buildPayload } from "@/lib/payload.ts";
import { parseIncoming } from "@/lib/store.ts";
import { applyTheme } from "@/lib/theme.ts";
import { hapticSelection, hapticSuccess } from "@/lib/haptics.ts";
import type { DB, Language, ThemeMode } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import {
  Bell,
  BellOff,
  Brain,
  Check,
  ClipboardCopy,
  ClipboardPaste,
  Cloud,
  Download,
  FileText,
  Flame,
  Globe,
  HelpCircle,
  Laptop,
  Moon,
  MoreVertical,
  Music,
  Plus,
  Search,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  db: DB;
  lang: Language;
  dueCount: number;
  showInput: boolean;
  showSearch: boolean;
  onToggleInput: () => void;
  onToggleSearch: () => void;
  onReplace: (db: DB) => void;
  onUpdateMemory: (memory: string) => void;
  onUpdateSetting: <K extends keyof DB["settings"]>(k: K, v: DB["settings"][K]) => void;
  onClearDone: () => void;
  onMessage: (text: string, undo?: () => void) => void;
}

export function Header({
  db,
  lang,
  dueCount,
  showInput,
  showSearch,
  onToggleInput,
  onToggleSearch,
  onReplace,
  onUpdateMemory,
  onUpdateSetting,
  onClearDone,
  onMessage,
}: Props) {
  const t = getTranslation(lang);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [soundModalOpen, setSoundModalOpen] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  const currentTheme: ThemeMode = db.settings.theme || "dark";

  // Apply theme to DOM and status bar
  useEffect(() => {
    void applyTheme(currentTheme);
  }, [currentTheme]);

  // Close menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const selectLanguage = (newLang: Language) => {
    void hapticSelection();
    onUpdateSetting("language", newLang);
    onMessage(t.langChanged(newLang === "fa" ? "فارسی" : "English"));
  };

  const copy = async () => {
    const text = buildPayload(db);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      void hapticSuccess();
      onMessage(t.copySuccess);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setFallback(text);
    }
  };

  const apply = (text: string) => {
    const before = db;
    try {
      onReplace(parseIncoming(text));
      setFallback(null);
      void hapticSuccess();
      onMessage(t.pasteSuccess, () => onReplace(before));
    } catch (err) {
      onMessage(t.pasteFailed(err instanceof Error ? err.message : "Invalid input"));
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        onMessage(t.clipboardEmpty);
        return;
      }
      apply(text);
    } catch {
      setFallback("");
    }
  };

  const hasDone = db.tasks.some((task) => task.done);

  return (
    <header className="relative flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
      {/* Brand logo and due badge */}
      <div className="flex items-center gap-2.5">
        <div
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-inner overflow-hidden"
          title="TaskDrop"
        >
          <svg viewBox="0 0 100 100" className="size-9">
            <defs>
              <pattern
                id="header-dots"
                x="0"
                y="0"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="8" cy="8" r="0.8" fill="#71717a" fillOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100" height="100" rx="22" fill="#141417" />
            <rect width="100" height="100" rx="22" fill="url(#header-dots)" />
            <path
              d="M 34 52 L 46 64 L 68 38"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="46" cy="64" r="2.2" fill="#eab308" />
          </svg>
        </div>

        {dueCount > 0 && (
          <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300">
            {t.dueBadge(dueCount)}
          </span>
        )}
      </div>

      {/* Primary header actions */}
      <div className="flex items-center gap-2">
        {/* Copy for AI Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={copy}
          title={t.copyTitle}
          className="gap-1.5 border-zinc-700/90 bg-zinc-900/90 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800 font-medium text-xs px-3"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <ClipboardCopy className="size-3.5 text-zinc-300" />
          )}
          <span>{copied ? t.copied : t.copy}</span>
        </Button>

        {/* Paste from AI Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={paste}
          title={t.pasteTitle}
          className="gap-1.5 border-zinc-700/90 bg-zinc-900/90 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800 font-medium text-xs px-3"
        >
          <ClipboardPaste className="size-3.5 text-zinc-300" />
          <span>{t.paste}</span>
        </Button>

        {/* Toggle search input */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            showSearch
              ? lang === "fa"
                ? "بستن جستجو"
                : "Hide search"
              : lang === "fa"
                ? "جستجوی تسک‌ها (Cmd+K)"
                : "Search tasks (Cmd+K)"
          }
          title={
            showSearch
              ? lang === "fa"
                ? "بستن جستجو"
                : "Hide search"
              : lang === "fa"
                ? "جستجوی تسک‌ها (Cmd+K)"
                : "Search tasks (Cmd+K)"
          }
          onClick={onToggleSearch}
          className={cn(
            "transition-colors",
            showSearch ? "text-amber-400 bg-zinc-800/80" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          <Search className="size-4" />
        </Button>

        {/* Toggle quick add input */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={showInput ? t.toggleInputHide : t.toggleInputShow}
          title={showInput ? t.toggleInputHide : t.toggleInputShow}
          onClick={onToggleInput}
          className={cn(
            "transition-colors",
            showInput ? "text-zinc-200 bg-zinc-800/80" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          <Plus className={cn("size-4 transition-transform", showInput && "rotate-45")} />
        </Button>

        {/* Options & Settings Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.moreOptions}
            title={t.moreOptions}
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "text-zinc-400 hover:text-zinc-100",
              menuOpen && "bg-zinc-800 text-zinc-100",
            )}
          >
            <MoreVertical className="size-4" />
          </Button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute end-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 p-2 text-xs shadow-2xl backdrop-blur-md">
                {/* Language Switcher */}
                <div className="mb-2 px-2 py-1">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Globe className="size-3.5 text-sky-400" />
                      {t.language}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => selectLanguage("fa")}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        lang === "fa"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <span>فارسی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectLanguage("en")}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        lang === "en"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <span>English</span>
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-zinc-800/80" />

                {/* Theme Mode Switcher */}
                <div className="mb-2 px-2 py-1">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Sun className="size-3.5 text-amber-400" />
                      {t.themeMode}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSetting("theme", "dark");
                        onMessage(t.themeDarkActive);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        currentTheme === "dark"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Moon className="size-3 text-sky-400" />
                      <span>{t.themeDark}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSetting("theme", "light");
                        onMessage(t.themeLightActive);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        currentTheme === "light"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Sun className="size-3 text-amber-400" />
                      <span>{t.themeLight}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSetting("theme", "auto");
                        onMessage(t.themeAutoActive);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        currentTheme === "auto"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Laptop className="size-3 text-emerald-400" />
                      <span>{t.themeAuto}</span>
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-zinc-800/80" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setMemoryOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <Brain className="size-4 text-violet-400" />
                  <span className="flex-1 text-start">{t.aiMemory}</span>
                  {db.aiMemory?.trim() && (
                    <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setDigestOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="size-4 text-emerald-400" />
                  <span className="flex-1 text-start">{t.dailyDigest}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setStreakOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <Flame className="size-4 text-orange-400" />
                  <span className="flex-1 text-start">{t.weeklyStreak}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSyncOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <Cloud className="size-4 text-sky-400" />
                  <span className="flex-1 text-start">{t.cloudSync}</span>
                </button>

                <div className="my-1 border-t border-zinc-800/80" />

                <button
                  type="button"
                  onClick={() => {
                    const next = !db.settings.notifications;
                    onUpdateSetting("notifications", next);
                    if (next) void requestNotificationPermission();
                    onMessage(next ? t.notifEnabled : t.notifDisabled);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {db.settings.notifications ? (
                      <Bell className="size-4 text-zinc-200" />
                    ) : (
                      <BellOff className="size-4 text-zinc-500" />
                    )}
                    <span>{t.notifications}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium rounded-full px-2 py-0.5",
                      db.settings.notifications
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                        : "bg-zinc-900 text-zinc-500",
                    )}
                  >
                    {db.settings.notifications ? t.notifOn : t.notifOff}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !db.settings.sound;
                    onUpdateSetting("sound", next);
                    onMessage(next ? t.soundEnabled : t.soundDisabled);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {db.settings.sound ? (
                      <Volume2 className="size-4 text-zinc-200" />
                    ) : (
                      <VolumeX className="size-4 text-zinc-500" />
                    )}
                    <span>{t.alarmSound}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium rounded-full px-2 py-0.5",
                      db.settings.sound
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                        : "bg-zinc-900 text-zinc-500",
                    )}
                  >
                    {db.settings.sound ? t.notifOn : t.notifOff}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSoundModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Music className="size-4 text-amber-400" />
                    <span>{lang === "fa" ? "تم و نوع صدای زنگ" : "Alarm Sound Tone"}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {lang === "fa"
                      ? ALARM_SOUND_THEMES.find(
                          (st) => st.id === (db.settings.alarmTheme || "marimba"),
                        )?.titleFa
                      : ALARM_SOUND_THEMES.find(
                          (st) => st.id === (db.settings.alarmTheme || "marimba"),
                        )?.titleEn}
                  </span>
                </button>

                <div className="my-1 border-t border-zinc-800/80" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setHelpOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <HelpCircle className="size-4 text-zinc-400" />
                  <span className="flex-1 text-start">{t.helpAndShortcuts}</span>
                  <Kbd size="xs">?</Kbd>
                </button>

                <a
                  href="https://github.com/njfamirm/taskdrop/releases/download/nightly/taskdrop.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition-colors"
                >
                  <Download className="size-4 text-amber-400" />
                  <span className="flex-1 text-start font-medium">{t.downloadAndroid}</span>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                    {t.badgeNew}
                  </span>
                </a>

                {hasDone && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onClearDone();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-4 text-red-400" />
                    <span className="flex-1 text-start">{t.clearDone}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals & Sheets */}
      <AlarmSoundModal
        open={soundModalOpen}
        currentTheme={db.settings.alarmTheme || "marimba"}
        lang={lang}
        onSelectTheme={(theme) => {
          onUpdateSetting("alarmTheme", theme);
          const themeObj = ALARM_SOUND_THEMES.find((t) => t.id === theme);
          onMessage(
            lang === "fa"
              ? `صدای زنگ «${themeObj?.titleFa || theme}» تنظیم شد`
              : `Alarm sound set to ${themeObj?.titleEn || theme}`,
          );
        }}
        onClose={() => setSoundModalOpen(false)}
      />

      <AIMemorySheet
        open={memoryOpen}
        memory={db.aiMemory || ""}
        lang={lang}
        onSave={(mem) => {
          onUpdateMemory(mem);
          onMessage(t.aiMemoryUpdated);
        }}
        onClose={() => setMemoryOpen(false)}
      />

      <DailyDigestModal
        open={digestOpen}
        db={db}
        lang={lang}
        onClose={() => setDigestOpen(false)}
        onMessage={onMessage}
      />

      <StreakModal
        open={streakOpen}
        tasks={db.tasks}
        lang={lang}
        onClose={() => setStreakOpen(false)}
      />

      <SyncModal
        open={syncOpen}
        db={db}
        lang={lang}
        onSyncApply={onReplace}
        onClose={() => setSyncOpen(false)}
        onMessage={onMessage}
      />

      <HelpSheet open={helpOpen} lang={lang} onClose={() => setHelpOpen(false)} />

      {/* Fallback Paste Modal */}
      {fallback !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-semibold text-zinc-100">{t.pasteFallbackTitle}</h3>
            <Textarea
              autoFocus
              rows={8}
              defaultValue={fallback}
              placeholder={t.pasteFallbackPlaceholder}
              className="font-mono text-xs mb-3"
              id="sync-fallback-modal"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFallback(null)}>
                {t.cancel}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  apply(
                    document.querySelector<HTMLTextAreaElement>("#sync-fallback-modal")?.value ??
                      "",
                  )
                }
              >
                {t.apply}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
