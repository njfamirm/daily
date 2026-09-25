import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/input.tsx";
import {
  ALARM_SOUND_THEMES,
  type AlarmSoundTheme,
  playAlarmSound,
  stopAlarmRing,
} from "@/lib/alarmAudio.ts";
import { hapticSelection, hapticSuccess } from "@/lib/haptics.ts";
import { getTranslation } from "@/lib/i18n.ts";
import { requestNotificationPermission } from "@/lib/notify.ts";
import type { DB, Language, ThemeMode } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import {
  Bell,
  Brain,
  Check,
  Cloud,
  Download,
  Laptop,
  Moon,
  Play,
  Settings,
  Sliders,
  Sparkles,
  Square,
  Sun,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  db: DB;
  lang?: Language;
  onClose: () => void;
  onUpdateSetting: <K extends keyof DB["settings"]>(k: K, v: DB["settings"][K]) => void;
  onUpdateMemory: (memory: string) => void;
  onMessage: (text: string, undo?: () => void) => void;
  onOpenSyncModal: () => void;
}

type TabType = "general" | "alerts" | "ai" | "sync";

const MEMORY_PROMPTS_FA = [
  "همیشه کارهای کاری و پروژه را با اولویت بالا ثبت کن",
  "قبل از ساعت ۹ صبح و بعد از ۱۰ شب تسک موعددار نگذار",
  "برای تمام تسک‌های مطالعه و یادگیری برچسب #کتاب بگذار",
  "پنجشنبه‌ها و جمعه‌ها کارهای شخصی و خانوادگی اولویت دارند",
];

const MEMORY_PROMPTS_EN = [
  "Always set deep-work coding tasks to High Priority",
  "Do not schedule deadlines before 9:00 AM or after 10:00 PM",
  "Tag all reading and learning commitments with #books",
  "Keep weekends focused on personal, health, and family habits",
];

export function SettingsModal({
  open,
  db,
  lang = "fa",
  onClose,
  onUpdateSetting,
  onUpdateMemory,
  onMessage,
  onOpenSyncModal,
}: Props) {
  const t = getTranslation(lang);
  const isFa = lang === "fa";
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [memoryValue, setMemoryValue] = useState(db.aiMemory || "");
  const [playingTheme, setPlayingTheme] = useState<AlarmSoundTheme | null>(null);

  const currentTheme: ThemeMode = db.settings.theme || "dark";
  const currentSoundTheme: AlarmSoundTheme = db.settings.alarmTheme || "marimba";

  useEffect(() => {
    setMemoryValue(db.aiMemory || "");
  }, [db.aiMemory, open]);

  useEffect(() => {
    if (!open) {
      stopAlarmRing();
      setPlayingTheme(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      stopAlarmRing();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSaveMemory = () => {
    onUpdateMemory(memoryValue.trim());
    void hapticSuccess();
    onMessage(t.aiMemoryUpdated);
  };

  const handleToggleSoundPreview = (themeId: AlarmSoundTheme) => {
    if (playingTheme === themeId) {
      stopAlarmRing();
      setPlayingTheme(null);
    } else {
      setPlayingTheme(themeId);
      playAlarmSound(themeId);
    }
  };

  const handleSelectSoundTheme = (themeId: AlarmSoundTheme) => {
    void hapticSelection();
    onUpdateSetting("alarmTheme", themeId);
    const themeObj = ALARM_SOUND_THEMES.find((st) => st.id === themeId);
    onMessage(
      isFa
        ? `صدای زنگ «${themeObj?.titleFa || themeId}» تنظیم شد`
        : `Alarm sound set to ${themeObj?.titleEn || themeId}`,
    );
  };

  const tabs: { id: TabType; label: string; icon: typeof Sliders }[] = [
    { id: "general", label: isFa ? "عمومی" : "General", icon: Sliders },
    { id: "alerts", label: isFa ? "صدا و هشدار" : "Alerts & Sound", icon: Bell },
    { id: "ai", label: isFa ? "هوش مصنوعی" : "AI Memory", icon: Brain },
    { id: "sync", label: isFa ? "همگام‌سازی" : "Sync", icon: Cloud },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Settings className="size-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {isFa ? "تنظیمات برنامه" : "Settings & Preferences"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isFa
                  ? "شخصی‌سازی ظاهر، اعلان‌ها، زنگ هشدار و هوش مصنوعی"
                  : "Customize appearance, notifications, alarms and AI memory"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.close}
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/40 px-5 pt-2 gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  void hapticSelection();
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                  isActive
                    ? "border-amber-400 text-amber-300 font-semibold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-zinc-300">
          {/* TAB: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-200">{t.language}</span>
                  <span className="text-[11px] text-zinc-500">
                    {lang === "fa" ? "فارسی" : "English"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      void hapticSelection();
                      onUpdateSetting("language", "fa");
                      onMessage(t.langChanged("فارسی"));
                    }}
                    className={cn(
                      "flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                      lang === "fa"
                        ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    فارسی
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void hapticSelection();
                      onUpdateSetting("language", "en");
                      onMessage(t.langChanged("English"));
                    }}
                    className={cn(
                      "flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                      lang === "en"
                        ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-200">{t.themeMode}</span>
                  <span className="text-[11px] text-zinc-500">
                    {currentTheme === "dark"
                      ? t.themeDark
                      : currentTheme === "light"
                        ? t.themeLight
                        : t.themeAuto}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      void hapticSelection();
                      onUpdateSetting("theme", "dark");
                      onMessage(t.themeDarkActive);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                      currentTheme === "dark"
                        ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    <Moon className="size-3.5 text-zinc-400" />
                    <span>{t.themeDark}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void hapticSelection();
                      onUpdateSetting("theme", "light");
                      onMessage(t.themeLightActive);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                      currentTheme === "light"
                        ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    <Sun className="size-3.5 text-zinc-400" />
                    <span>{t.themeLight}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void hapticSelection();
                      onUpdateSetting("theme", "auto");
                      onMessage(t.themeAutoActive);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                      currentTheme === "auto"
                        ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    <Laptop className="size-3.5 text-zinc-400" />
                    <span>{t.themeAuto}</span>
                  </button>
                </div>
              </div>

              {/* Android Download Option */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
                <div className="space-y-0.5">
                  <div className="font-medium text-zinc-200">{t.downloadAndroid}</div>
                  <p className="text-[11px] text-zinc-500">
                    {isFa
                      ? "نصب مستقیم اپلیکیشن روی گوشی با اعلان‌های بومی و آلارم"
                      : "Direct APK installation with native alarms and background notifications"}
                  </p>
                </div>
                <a
                  href="https://github.com/njfamirm/taskdrop/releases/download/nightly/taskdrop.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <Download className="size-3.5" />
                  <span>{isFa ? "دانلود APK" : "Download APK"}</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB: ALERTS & SOUNDS */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              {/* Browser Notifications Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
                <div className="space-y-0.5">
                  <div className="font-medium text-zinc-200">{t.notifications}</div>
                  <p className="text-[11px] text-zinc-500">
                    {isFa
                      ? "ارسال نوتیفیکیشن در زمان سررسید تسک‌ها"
                      : "Send system notification when a task reaches its deadline"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void hapticSelection();
                    const next = !db.settings.notifications;
                    onUpdateSetting("notifications", next);
                    if (next) void requestNotificationPermission();
                    onMessage(next ? t.notifEnabled : t.notifDisabled);
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    db.settings.notifications ? "bg-amber-500" : "bg-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      db.settings.notifications ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Alarm Sound Master Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
                <div className="space-y-0.5">
                  <div className="font-medium text-zinc-200">{t.alarmSound}</div>
                  <p className="text-[11px] text-zinc-500">
                    {isFa
                      ? "پخش آلارم صوتی مداوم برای تسک‌های سررسیدشده"
                      : "Play continuous audio alarm loop when deadlines trigger"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void hapticSelection();
                    const next = !db.settings.sound;
                    onUpdateSetting("sound", next);
                    onMessage(next ? t.soundEnabled : t.soundDisabled);
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    db.settings.sound ? "bg-amber-500" : "bg-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      db.settings.sound ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Alarm Chime Themes Selector */}
              <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-200">
                    {isFa ? "تم و الگوی صدای زنگ" : "Alarm Melody Pattern"}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {isFa
                      ? ALARM_SOUND_THEMES.find((st) => st.id === currentSoundTheme)?.titleFa
                      : ALARM_SOUND_THEMES.find((st) => st.id === currentSoundTheme)?.titleEn}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {ALARM_SOUND_THEMES.map((theme) => {
                    const isSelected = currentSoundTheme === theme.id;
                    const isPlaying = playingTheme === theme.id;

                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleSelectSoundTheme(theme.id)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-3 py-2 transition-colors cursor-pointer",
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Volume2
                            className={cn(
                              "size-3.5",
                              isSelected ? "text-amber-400" : "text-zinc-500",
                            )}
                          />
                          <span className="font-medium text-xs">
                            {isFa ? theme.titleFa : theme.titleEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSoundPreview(theme.id);
                            }}
                            title={isFa ? "تست صدا" : "Preview Tone"}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                          >
                            {isPlaying ? (
                              <Square className="size-3 text-red-400" />
                            ) : (
                              <Play className="size-3 text-zinc-400" />
                            )}
                          </button>
                          {isSelected && <Check className="size-3.5 text-amber-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI MEMORY */}
          {activeTab === "ai" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="font-medium text-zinc-200">{t.aiMemoryTitle}</div>
                <p className="text-[11px] leading-relaxed text-zinc-400">{t.aiMemoryDesc}</p>
              </div>

              <Textarea
                rows={5}
                value={memoryValue}
                onChange={(e) => setMemoryValue(e.target.value)}
                placeholder={t.aiMemoryPlaceholder}
                className="font-normal text-xs leading-5 border-zinc-700/80 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:ring-amber-400/30"
              />

              <div>
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                  <Sparkles className="size-3 text-amber-400" />
                  <span>{t.aiMemoryQuickPrompts}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(isFa ? MEMORY_PROMPTS_FA : MEMORY_PROMPTS_EN).map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => {
                        setMemoryValue((prev) =>
                          prev.trim() ? `${prev.trim()}\n- ${prompt}` : `- ${prompt}`,
                        );
                      }}
                      className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 cursor-pointer text-start"
                    >
                      + {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-[11px] text-zinc-500">
                  {memoryValue.trim() ? t.aiMemoryActive : t.aiMemoryEmpty}
                </span>
                <Button
                  size="sm"
                  onClick={handleSaveMemory}
                  className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold"
                >
                  {t.aiMemorySave}
                </Button>
              </div>
            </div>
          )}

          {/* TAB: SYNC & CLOUD */}
          {activeTab === "sync" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                    <Cloud className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-100">{t.cloudSync}</div>
                    <div className="text-[11px] text-zinc-400">
                      {isFa
                        ? "همگام‌سازی ابری رمزنگاری‌شده مبدا به مقصد (E2EE)"
                        : "End-to-end encrypted synchronization across devices"}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onOpenSyncModal();
                    }}
                    className="w-full border-zinc-700 bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700"
                  >
                    {isFa ? "تنظیم سرور و کلید همگام‌سازی" : "Configure Sync Server & Key"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-800/80 bg-zinc-900/30 px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          >
            {isFa ? "بستن" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
