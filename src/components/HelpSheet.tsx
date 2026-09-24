import { Button } from "@/components/ui/button.tsx";
import { Kbd } from "@/components/ui/kbd.tsx";
import { X } from "lucide-react";
import { useEffect } from "react";

interface Row {
  pattern: string;
  meaning: string;
}

interface ShortcutRow {
  shortcuts: string[][];
  meaning: string;
}

const PRIORITY_ROWS: Row[] = [
  { pattern: "!فوری / !مهم / فوری / ضروری", meaning: "اولویت بالا با نوار و نشانگر قرمز" },
  { pattern: "!متوسط / اولویت متوسط", meaning: "اولویت متوسط با نوار نارنجی" },
  { pattern: "!کم / سر فرصت / هر وقت شد", meaning: "اولویت پایین با نوار آبی" },
];

const DATE_ROWS: Row[] = [
  { pattern: "امروز / فردا / پس‌فردا", meaning: "همان روز، ساعت پیش‌فرض ۹:۰۰" },
  { pattern: "آخر هفته / پایان هفته", meaning: "پنج‌شنبه ساعت ۹:۰۰" },
  { pattern: "دوشنبه / شنبه هفته بعد", meaning: "روز مشخص هفته" },
  { pattern: "۱۴۰۴/۰۷/۱۲ یا 2026-09-28", meaning: "تاریخ تقویمی" },
];

const TIME_ROWS: Row[] = [
  { pattern: "اول صبح / صبح / ظهر / عصر / غروب / شب / آخر شب", meaning: "بازه زمانی مشخص در روز" },
  { pattern: "ساعت ۱۰ / ساعت 22:30 / ۸ صبح / ۹pm", meaning: "ساعت دقیق عددی" },
  { pattern: "نیم ساعت دیگه / یک ربع دیگه / +۲ ساعت دیگه", meaning: "نسبت به همین لحظه" },
];

const REPEAT_ROWS: Row[] = [
  { pattern: "هر روز / روزانه", meaning: "تکرار روزانه" },
  { pattern: "هر هفته / هفتگی", meaning: "تکرار هفتگی" },
  { pattern: "هر ماه / ماهانه", meaning: "تکرار ماهانه" },
];

const SHORTCUT_ROWS: ShortcutRow[] = [
  { shortcuts: [["/"], ["N"]], meaning: "فوکوس روی فیلد ثبت تسک جدید" },
  { shortcuts: [["؟"], ["Shift", "/"]], meaning: "باز کردن راهنما و کلیدهای میانبر" },
  { shortcuts: [["M"]], meaning: "افزودن نکته جدید در بخش جلوی چشم" },
  { shortcuts: [["S"]], meaning: "قطع و وصل صدای زنگ" },
  { shortcuts: [["B"]], meaning: "فعال و غیرفعال‌سازی نوتیفیکیشن" },
  {
    shortcuts: [
      ["Ctrl", "Z"],
      ["⌘", "Z"],
    ],
    meaning: "بازگرداندن آخرین تسک حذف‌شده",
  },
  { shortcuts: [["Esc"]], meaning: "بستن پنجره‌ها یا لغو عملیات" },
];

const OTHER_ROWS: Row[] = [
  { pattern: "#کار / #پروژه / #خرید / #شخصی", meaning: "برچسب‌های رنگی" },
  { pattern: "بدون هیچ‌کدام از بالا", meaning: "ثبت تسک ساده بدون موعد" },
];

function ShortcutsTable({ title, rows }: { title: string; rows: ShortcutRow[] }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold text-zinc-300">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        {rows.map((r, i) => (
          <div
            key={i}
            className={
              "flex items-center justify-between gap-4 px-3 py-2 text-sm" +
              (i > 0 ? " border-t border-zinc-800/80" : "")
            }
          >
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {r.shortcuts.map((combo, comboIdx) => (
                <div key={comboIdx} className="flex items-center gap-1">
                  {comboIdx > 0 && <span className="text-[11px] text-zinc-500 px-0.5">یا</span>}
                  {combo.map((k, kIdx) => (
                    <span key={kIdx} className="flex items-center gap-1">
                      {kIdx > 0 && <span className="text-[10px] text-zinc-500">+</span>}
                      <Kbd size="xs">{k}</Kbd>
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <span className="text-end text-zinc-400 text-xs">{r.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold text-zinc-300">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        {rows.map((r, i) => (
          <div
            key={r.pattern}
            className={
              "flex items-start justify-between gap-4 px-3 py-2 text-sm" +
              (i > 0 ? " border-t border-zinc-800/80" : "")
            }
          >
            <code className="shrink-0 font-mono text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded-md text-xs border border-zinc-700/60 shadow-xs">
              {r.pattern}
            </code>
            <span className="text-end text-zinc-400 text-xs leading-5">{r.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/** راهنمای الگوهایی که ورودی آزاد به تسک تبدیل می‌شوند. */
export function HelpSheet({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h2 className="text-base font-semibold text-zinc-100">راهنما و کلیدهای میانبر</h2>
          <Button variant="ghost" size="icon" aria-label="بستن" onClick={onClose}>
            <X />
          </Button>
        </div>

        <p className="mb-4 text-xs leading-6 text-zinc-300">
          هر چه در خط ورودی بنویسید، اپ ابتدا این الگوها را از متن تشخیص داده و استخراج می‌کند و بقیه
          متن عنوان تسک خواهد شد.
        </p>

        <div className="space-y-4">
          <ShortcutsTable title="⌨️ کلیدهای میانبر" rows={SHORTCUT_ROWS} />
          <Table title="🚨 اولویت‌بندی" rows={PRIORITY_ROWS} />
          <Table title="📅 تاریخ" rows={DATE_ROWS} />
          <Table title="⏰ ساعت" rows={TIME_ROWS} />
          <Table title="🔁 تکرار" rows={REPEAT_ROWS} />
          <Table title="🏷️ برچسب‌ها و بقیه موارد" rows={OTHER_ROWS} />
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm">
          <div className="mb-1 text-xs font-semibold text-zinc-400">مثال ترکیبی</div>
          <code className="text-zinc-100 font-mono text-xs">هر روز ساعت ۸ ورزش #سلامتی</code>
          <div className="mt-1 text-xs text-zinc-400">
            عنوان: «ورزش»، موعد: فردا ۸:۰۰، تکرار: هر روز، تگ: سلامتی
          </div>
        </div>
      </div>
    </div>
  );
}
