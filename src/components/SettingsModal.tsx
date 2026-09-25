import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/input.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
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
  const [activeTab, setActiveTab] = useState("general");
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
    }
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Settings className="size-4" />
            </div>
            <div>
              <DialogTitle>{isFa ? "تنظیمات برنامه" : "Settings & Preferences"}</DialogTitle>
              <DialogDescription>
                {isFa
                  ? "شخصی‌سازی ظاهر، اعلان‌ها، زنگ هشدار و هوش مصنوعی"
                  : "Customize appearance, notifications, alarms and AI memory"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabbed Settings */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
          <div className="border-b border-zinc-800/80 bg-zinc-900/30 px-5 pt-2">
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-2">
              <TabsTrigger
                value="general"
                className="gap-1.5 pb-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-400"
              >
                <Sliders className="size-3.5" />
                <span>{isFa ? "عمومی" : "General"}</span>
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="gap-1.5 pb-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-400"
              >
                <Bell className="size-3.5" />
                <span>{isFa ? "صدا و هشدار" : "Alerts & Sound"}</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="gap-1.5 pb-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-400"
              >
                <Brain className="size-3.5" />
                <span>{isFa ? "هوش مصنوعی" : "AI Memory"}</span>
              </TabsTrigger>
              <TabsTrigger
                value="sync"
                className="gap-1.5 pb-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-400"
              >
                <Cloud className="size-3.5" />
                <span>{isFa ? "همگام‌سازی" : "Sync"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
            {/* GENERAL TAB */}
            <TabsContent value="general" className="space-y-4 m-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs">{t.language}</CardTitle>
                    <span className="text-[11px] text-zinc-500">
                      {lang === "fa" ? "فارسی" : "English"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs">{t.themeMode}</CardTitle>
                    <span className="text-[11px] text-zinc-500">
                      {currentTheme === "dark"
                        ? t.themeDark
                        : currentTheme === "light"
                          ? t.themeLight
                          : t.themeAuto}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
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
                      <Moon className="size-3.5" />
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
                      <Sun className="size-3.5" />
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
                      <Laptop className="size-3.5" />
                      <span>{t.themeAuto}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-xs">{t.downloadAndroid}</CardTitle>
                    <CardDescription>
                      {isFa
                        ? "نصب مستقیم اپلیکیشن روی گوشی با اعلان‌های بومی و آلارم"
                        : "Direct APK installation with native alarms and background notifications"}
                    </CardDescription>
                  </div>
                  <a
                    href="https://github.com/njfamirm/taskdrop/releases/download/nightly/taskdrop.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    <Download className="size-3.5" />
                    <span>APK</span>
                  </a>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ALERTS TAB */}
            <TabsContent value="alerts" className="space-y-4 m-0">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-xs">{t.notifications}</CardTitle>
                    <CardDescription>
                      {isFa
                        ? "ارسال نوتیفیکیشن در زمان سررسید تسک‌ها"
                        : "Send system notification when a task reaches its deadline"}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={Boolean(db.settings.notifications)}
                    onCheckedChange={(checked) => {
                      void hapticSelection();
                      onUpdateSetting("notifications", checked);
                      if (checked) void requestNotificationPermission();
                      onMessage(checked ? t.notifEnabled : t.notifDisabled);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-xs">{t.alarmSound}</CardTitle>
                    <CardDescription>
                      {isFa
                        ? "پخش آلارم صوتی مداوم برای تسک‌های سررسیدشده"
                        : "Play continuous audio alarm loop when deadlines trigger"}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={Boolean(db.settings.sound)}
                    onCheckedChange={(checked) => {
                      void hapticSelection();
                      onUpdateSetting("sound", checked);
                      onMessage(checked ? t.soundEnabled : t.soundDisabled);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs">
                      {isFa ? "تم و الگوی صدای زنگ" : "Alarm Melody Pattern"}
                    </CardTitle>
                    <span className="text-[11px] text-zinc-500">
                      {isFa
                        ? ALARM_SOUND_THEMES.find((st) => st.id === currentSoundTheme)?.titleFa
                        : ALARM_SOUND_THEMES.find((st) => st.id === currentSoundTheme)?.titleEn}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI TAB */}
            <TabsContent value="ai" className="space-y-3 m-0">
              <div className="space-y-1">
                <CardTitle className="text-xs">{t.aiMemoryTitle}</CardTitle>
                <CardDescription>{t.aiMemoryDesc}</CardDescription>
              </div>

              <Textarea
                rows={5}
                value={memoryValue}
                onChange={(e) => setMemoryValue(e.target.value)}
                placeholder={t.aiMemoryPlaceholder}
                className="font-normal text-xs leading-5"
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
            </TabsContent>

            {/* SYNC TAB */}
            <TabsContent value="sync" className="space-y-4 m-0">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                      <Cloud className="size-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">{t.cloudSync}</div>
                      <div className="text-[11px] text-zinc-400">
                        {isFa
                          ? "همگام‌سازی ابری با رمزنگاری سرتاسری"
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
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-800/80 bg-zinc-900/30 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            {isFa ? "بستن" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
