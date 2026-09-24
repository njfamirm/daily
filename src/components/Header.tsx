import { AIMemorySheet } from "@/components/AIMemorySheet.tsx";
import { DailyDigestModal } from "@/components/DailyDigestModal.tsx";
import { HelpSheet } from "@/components/HelpSheet.tsx";
import { StreakModal } from "@/components/StreakModal.tsx";
import { SyncModal } from "@/components/SyncModal.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/input.tsx";
import { Kbd } from "@/components/ui/kbd.tsx";
import { requestNotificationPermission } from "@/lib/notify.ts";
import { buildPayload } from "@/lib/payload.ts";
import { parseIncoming } from "@/lib/store.ts";
import { applyTheme, COLOR_PRESETS } from "@/lib/theme.ts";
import { hapticSelection, hapticSuccess } from "@/lib/haptics.ts";
import type { DB, PrimaryColor, ThemeMode } from "@/lib/types.ts";
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
  HelpCircle,
  Laptop,
  Moon,
  MoreVertical,
  Palette,
  Plus,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  db: DB;
  dueCount: number;
  showInput: boolean;
  onToggleInput: () => void;
  onReplace: (db: DB) => void;
  onUpdateMemory: (memory: string) => void;
  onUpdateSetting: <K extends keyof DB["settings"]>(k: K, v: DB["settings"][K]) => void;
  onClearDone: () => void;
  onMessage: (text: string, undo?: () => void) => void;
}

export function Header({
  db,
  dueCount,
  showInput,
  onToggleInput,
  onReplace,
  onUpdateMemory,
  onUpdateSetting,
  onClearDone,
  onMessage,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  const currentTheme: ThemeMode = db.settings.theme || "dark";
  const currentPrimary: PrimaryColor = db.settings.primaryColor || "yellow";
  const activeColorObj = COLOR_PRESETS.find((c) => c.id === currentPrimary) || COLOR_PRESETS[0];

  // اعمال تم و رنگ پرایمری به سند
  useEffect(() => {
    void applyTheme(currentTheme, currentPrimary);
  }, [currentTheme, currentPrimary]);

  // بستن منو با Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const selectPrimaryColor = (color: PrimaryColor) => {
    void hapticSelection();
    onUpdateSetting("primaryColor", color);
    const colorObj = COLOR_PRESETS.find((c) => c.id === color);
    onMessage(`رنگ ${colorObj?.label || color} انتخاب شد`);
  };

  const copy = async () => {
    const text = buildPayload(db);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      void hapticSuccess();
      onMessage("کپی شد! پرامپت و دیتای تسک‌ها در کلیپ‌بورد قرار گرفت");
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
      onMessage("دیتا با موفقیت از AI جایگزین شد", () => onReplace(before));
    } catch (err) {
      onMessage(`پیست نشد: ${err instanceof Error ? err.message : "ورودی نامعتبر"}`);
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        onMessage("کلیپ‌بورد خالی است");
        return;
      }
      apply(text);
    } catch {
      setFallback("");
    }
  };

  const hasDone = db.tasks.some((t) => t.done);

  return (
    <header className="relative flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
      {/* لوگوی اختصاصی و نشانگر سررسید */}
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
            <circle cx="46" cy="64" r="2.2" fill={activeColorObj.bgHex} />
          </svg>
        </div>

        {dueCount > 0 && (
          <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300">
            {dueCount} سررسید
          </span>
        )}
      </div>

      {/* دکمه‌های اصلی هدر */}
      <div className="flex items-center gap-2">
        {/* دکمه برجسته کپی برای AI */}
        <Button
          variant="outline"
          size="sm"
          onClick={copy}
          title="کپی برای هوش مصنوعی"
          className="gap-1.5 border-zinc-700/90 bg-zinc-900/90 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800 font-medium text-xs px-3"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <ClipboardCopy className="size-3.5 text-zinc-300" />
          )}
          <span>{copied ? "کپی شد" : "کپی"}</span>
        </Button>

        {/* دکمه برجسته پیست از AI */}
        <Button
          variant="outline"
          size="sm"
          onClick={paste}
          title="جایگزینی سریع دیتای ویرایش شده با خروجی هوش مصنوعی"
          className="gap-1.5 border-zinc-700/90 bg-zinc-900/90 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800 font-medium text-xs px-3"
        >
          <ClipboardPaste className="size-3.5 text-zinc-300" />
          <span>پیست</span>
        </Button>

        {/* دکمه مخفی/نمایش باکس ورود تسک دستی */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={showInput ? "مخفی‌کردن باکس ورودی" : "نمایش باکس ورودی دستی"}
          title={showInput ? "مخفی‌کردن باکس ورودی دستی" : "نمایش باکس ورودی دستی"}
          onClick={onToggleInput}
          className={cn(
            "transition-colors",
            showInput ? "text-zinc-200 bg-zinc-800/80" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          <Plus className={cn("size-4 transition-transform", showInput && "rotate-45")} />
        </Button>

        {/* منوی سه نقطه برای همه امکانات دیگر */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label="منوی گزینه‌ها"
            title="امکانات و تنظیمات بیشتر"
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
              <div className="absolute end-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 p-2 text-xs shadow-2xl backdrop-blur-md">
                {/* سوییچ سه‌حالته تم: تاریک / روشن / خودکار */}
                <div className="mb-2 px-2 py-1">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Sun className="size-3.5 text-amber-400" />
                      حالت تم
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSetting("theme", "dark");
                        onMessage("تم تاریک فعال شد");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        currentTheme === "dark"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Moon className="size-3 text-sky-400" />
                      <span>تاریک</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSetting("theme", "light");
                        onMessage("تم روشن فعال شد");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        currentTheme === "light"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Sun className="size-3 text-amber-400" />
                      <span>روشن</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSetting("theme", "auto");
                        onMessage("تم خودکار سیستم فعال شد");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        currentTheme === "auto"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Laptop className="size-3 text-emerald-400" />
                      <span>خودکار</span>
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-zinc-800/80" />

                {/* انتخاب پالت رنگ پرایمری */}
                <div className="mb-2 px-2 py-1">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Palette className="size-3.5 text-amber-400" />
                      رنگ تم اصلی
                    </span>
                    <span className="text-[10px] text-zinc-500">{activeColorObj.label}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = currentPrimary === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => selectPrimaryColor(preset.id)}
                          title={preset.label}
                          className={cn(
                            "relative size-6 rounded-full transition-transform hover:scale-110 cursor-pointer",
                            preset.dotClass,
                            isSelected &&
                              "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110",
                          )}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="my-1 border-t border-zinc-800/80" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setMemoryOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <Brain className="size-4 text-violet-400" />
                  <span className="flex-1 text-start">حافظه هوش مصنوعی</span>
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
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <FileText className="size-4 text-emerald-400" />
                  <span className="flex-1 text-start">گزارش روزانه</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setStreakOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <Flame className="size-4 text-orange-400" />
                  <span className="flex-1 text-start">آمار و پیوستگی ۷ روزه</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSyncOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <Cloud className="size-4 text-sky-400" />
                  <span className="flex-1 text-start">همگام‌سازی ابری (E2EE)</span>
                </button>

                <div className="my-1 border-t border-zinc-800/80" />

                <button
                  type="button"
                  onClick={() => {
                    const next = !db.settings.notifications;
                    onUpdateSetting("notifications", next);
                    if (next) void requestNotificationPermission();
                    onMessage(next ? "نوتیفیکیشن فعال شد" : "نوتیفیکیشن غیرفعال شد");
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {db.settings.notifications ? (
                      <Bell className="size-4 text-zinc-200" />
                    ) : (
                      <BellOff className="size-4 text-zinc-500" />
                    )}
                    <span>نوتیفیکیشن مرورگر</span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium rounded-full px-2 py-0.5",
                      db.settings.notifications
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                        : "bg-zinc-900 text-zinc-500",
                    )}
                  >
                    {db.settings.notifications ? "روشن" : "خاموش"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !db.settings.sound;
                    onUpdateSetting("sound", next);
                    onMessage(next ? "صدای زنگ فعال شد" : "صدای زنگ خاموش شد");
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {db.settings.sound ? (
                      <Volume2 className="size-4 text-zinc-200" />
                    ) : (
                      <VolumeX className="size-4 text-zinc-500" />
                    )}
                    <span>صدای زنگ هشدار</span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium rounded-full px-2 py-0.5",
                      db.settings.sound
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                        : "bg-zinc-900 text-zinc-500",
                    )}
                  >
                    {db.settings.sound ? "روشن" : "خاموش"}
                  </span>
                </button>

                <div className="my-1 border-t border-zinc-800/80" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setHelpOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  <HelpCircle className="size-4 text-zinc-400" />
                  <span className="flex-1 text-start">راهنما و کلیدهای میانبر</span>
                  <Kbd size="xs">؟</Kbd>
                </button>

                <a
                  href="https://github.com/njfamirm/taskdrop/releases/download/nightly/taskdrop.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition-colors"
                >
                  <Download className="size-4 text-amber-400" />
                  <span className="flex-1 text-start font-medium">دانلود نسخه اندروید (APK)</span>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                    جدید
                  </span>
                </a>

                {hasDone && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onClearDone();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="size-4 text-red-400" />
                    <span className="flex-1 text-start">پاک‌سازی انجام‌شده‌ها</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* مدال‌ها و دیالوگ‌ها */}
      <AIMemorySheet
        open={memoryOpen}
        memory={db.aiMemory || ""}
        onSave={(mem) => {
          onUpdateMemory(mem);
          onMessage("حافظه هوش مصنوعی به‌روزرسانی شد");
        }}
        onClose={() => setMemoryOpen(false)}
      />

      <DailyDigestModal
        open={digestOpen}
        db={db}
        onClose={() => setDigestOpen(false)}
        onMessage={onMessage}
      />

      <StreakModal open={streakOpen} tasks={db.tasks} onClose={() => setStreakOpen(false)} />

      <SyncModal
        open={syncOpen}
        db={db}
        onSyncApply={onReplace}
        onClose={() => setSyncOpen(false)}
        onMessage={onMessage}
      />

      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* فال‌بک پیست در صورت عدم دسترسی به کلیپ‌بورد */}
      {fallback !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-semibold text-zinc-100">پیست خروجی هوش مصنوعی</h3>
            <Textarea
              autoFocus
              rows={8}
              defaultValue={fallback}
              placeholder="خروجی هوش مصنوعی را اینجا پیست کنید…"
              className="font-mono text-xs mb-3"
              id="sync-fallback-modal"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFallback(null)}>
                انصراف
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
                اعمال کن
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
