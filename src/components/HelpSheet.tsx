import { Button } from "@/components/ui/button.tsx";
import { X } from "lucide-react";
import { useEffect } from "react";

interface Row {
  pattern: string;
  meaning: string;
}

const DATE_ROWS: Row[] = [
  { pattern: "امروز / فردا / پس‌فردا", meaning: "همان روز، ساعت پیش‌فرض ۹:۰۰" },
  { pattern: "دوشنبه", meaning: "دوشنبهٔ همین هفته یا هفتهٔ بعد (هر کدام جلوتر است)" },
  { pattern: "دوشنبه هفته بعد", meaning: "دوشنبهٔ هفتهٔ بعد، حتماً یک هفته جلوتر" },
  { pattern: "۱۴۰۴/۰۷/۱۲ یا 2026-09-28", meaning: "تاریخ مطلق" },
];

const TIME_ROWS: Row[] = [
  { pattern: "ساعت ۱۰ / ساعت 22:30", meaning: "زمان مشخص در همان روز" },
  { pattern: "۸ صبح / ۹pm / ۵ عصر", meaning: "ساعت با تشخیص قبل/بعدازظهر" },
  { pattern: "+۲ ساعت دیگه / ۳۰ دقیقه دیگه / ۳ روز دیگه", meaning: "نسبت به همین الان" },
];

const REPEAT_ROWS: Row[] = [
  { pattern: "هر روز / روزانه", meaning: "تکرار روزانه" },
  { pattern: "هر هفته / هفتگی", meaning: "تکرار هفتگی" },
  { pattern: "هر ماه / ماهانه", meaning: "تکرار ماهانه" },
];

const SHORTCUT_ROWS: Row[] = [
  { pattern: "/  یا  N", meaning: "فوکوس روی فیلد ثبت تسک جدید" },
  { pattern: "؟  یا  Shift + /", meaning: "باز کردن راهنما و کلیدهای میانبر" },
  { pattern: "M", meaning: "افزودن نکته جدید در بخش «جلوی چشم»" },
  { pattern: "S", meaning: "قطع / وصل صدای زنگ" },
  { pattern: "B", meaning: "فعال / غیرفعال‌سازی نوتیفیکیشن" },
  { pattern: "Ctrl + Z / ⌘Z", meaning: "بازگرداندن (Undo) آخرین تسک حذف‌شده" },
  { pattern: "Esc", meaning: "بستن پنجره‌ها یا انصراف از ویرایش" },
];

const OTHER_ROWS: Row[] = [
  { pattern: "#برچسب", meaning: "هر کلمه‌ای که با # شروع شود، تگ می‌شود" },
  { pattern: "بدون هیچ‌کدام از بالا", meaning: "فقط یک تسک بدون موعد ثبت می‌شود" },
];

function Table({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold text-zinc-300">{title}</h3>
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        {rows.map((r, i) => (
          <div
            key={r.pattern}
            className={
              "flex items-start justify-between gap-4 px-3 py-2 text-sm" +
              (i > 0 ? " border-t border-zinc-800/80" : "")
            }
          >
            <code className="shrink-0 font-mono text-zinc-100 bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs border border-zinc-700/60">
              {r.pattern}
            </code>
            <span className="text-end text-zinc-400 text-xs">{r.meaning}</span>
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
          هرچی توی خط بنویسی، اپ اول این الگوها رو از متن جدا می‌کنه و بقیه‌ش می‌شه عنوان تسک. ترتیب
          اهمیتی نداره؛ می‌تونی همه رو با هم توی یک خط بیاری.
        </p>

        <div className="space-y-4">
          <Table title="⌨️ کلیدهای میانبر (Shortcuts)" rows={SHORTCUT_ROWS} />
          <Table title="📅 تاریخ" rows={DATE_ROWS} />
          <Table title="⏰ ساعت" rows={TIME_ROWS} />
          <Table title="🔁 تکرار" rows={REPEAT_ROWS} />
          <Table title="🏷️ برچسب‌ها و بقیه موارد" rows={OTHER_ROWS} />
        </div>

        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-sm">
          <div className="mb-1 text-xs font-semibold text-zinc-400">مثال ترکیبی</div>
          <code className="text-zinc-100 font-mono text-xs">هر روز ساعت ۸ ورزش #سلامتی</code>
          <div className="mt-1 text-xs text-zinc-400">
            → عنوان: «ورزش»، موعد: فردا ۸:۰۰، تکرار: هر روز، تگ: سلامتی
          </div>
        </div>
      </div>
    </div>
  );
}
