import { Button } from "@/components/ui/button.tsx";
import { formatDue } from "@/lib/parse.ts";
import type { DB } from "@/lib/types.ts";
import { Check, Copy, FileText, X } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  open: boolean;
  db: DB;
  onClose: () => void;
  onMessage: (msg: string) => void;
}

export function DailyDigestModal({ open, db, onClose, onMessage }: Props) {
  const [copied, setCopied] = useState(false);

  const digestText = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 864e5 - 1;
    const startOfTomorrow = endOfToday + 1;
    const endOfTomorrow = startOfTomorrow + 864e5 - 1;

    // انجام‌شده‌های امروز
    const doneToday = db.tasks.filter((t) => {
      if (!t.doneAt) return false;
      const doneTime = new Date(t.doneAt).getTime();
      return doneTime >= startOfToday && doneTime <= endOfToday;
    });

    // کارهای باز سررسیدشده یا امروز
    const openToday = db.tasks.filter((t) => {
      if (t.done) return false;
      if (!t.due) return false;
      const dueTime = new Date(t.due).getTime();
      return dueTime <= endOfToday;
    });

    // کارهای فردا
    const tomorrowTasks = db.tasks.filter((t) => {
      if (t.done) return false;
      if (!t.due) return false;
      const dueTime = new Date(t.due).getTime();
      return dueTime >= startOfTomorrow && dueTime <= endOfTomorrow;
    });

    let md = `📅 **گزارش روزانه** — ${dateStr}\n\n`;

    // بخش انجام‌شده
    md += `✅ **کارهای انجام‌شده امروز (${doneToday.length} مورد):**\n`;
    if (doneToday.length === 0) {
      md += `- هنوز تسکی امروز نهایی نشده است.\n`;
    } else {
      for (const t of doneToday) {
        const tagStr = t.tags.length > 0 ? ` [${t.tags.map((x) => `#${x}`).join(" ")}]` : "";
        md += `- [x] ${t.title}${tagStr}\n`;
      }
    }
    md += "\n";

    // بخش باقی‌مانده امروز
    if (openToday.length > 0) {
      md += `⏳ **باقی‌مانده‌های امروز (${openToday.length} مورد):**\n`;
      for (const t of openToday) {
        const pStr = t.priority === "high" ? " 🚨 فوری" : "";
        const tagStr = t.tags.length > 0 ? ` [${t.tags.map((x) => `#${x}`).join(" ")}]` : "";
        md += `- [ ] ${t.title}${pStr}${tagStr} (${formatDue(t.due)})\n`;
      }
      md += "\n";
    }

    // بخش برنامه‌های فردا
    if (tomorrowTasks.length > 0) {
      md += `🎯 **برنامه‌های فردا (${tomorrowTasks.length} مورد):**\n`;
      for (const t of tomorrowTasks) {
        const pStr = t.priority === "high" ? " 🚨 فوری" : "";
        const tagStr = t.tags.length > 0 ? ` [${t.tags.map((x) => `#${x}`).join(" ")}]` : "";
        md += `- [ ] ${t.title}${pStr}${tagStr}\n`;
      }
      md += "\n";
    }

    // بخش نکات ثابت
    if (db.notes.length > 0) {
      md += `📌 **یادداشت‌های جلوی چشم:**\n`;
      for (const n of db.notes) {
        md += `- ${n.text}\n`;
      }
      md += "\n";
    }

    md += `---\n_تولید شده توسط اپ daily_`;
    return md;
  }, [db]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(digestText);
      setCopied(true);
      onMessage("گزارش روزانه در کلیپ‌بورد کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onMessage("کپی نشد");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <FileText className="size-4" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100">گزارش روزانه</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="بستن" onClick={onClose}>
            <X />
          </Button>
        </div>

        <p className="mb-3 text-xs leading-6 text-zinc-400">
          خلاصه کارهای انجام‌شده و برنامه‌های آینده برای مرور شخصی یا ارسال در شبکه‌های اجتماعی و اسلک:
        </p>

        <div className="relative">
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 font-mono text-xs leading-6 text-zinc-200">
            {digestText}
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
          <span className="text-[11px] text-zinc-500">فرمت استاندارد Markdown</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              بستن
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500 font-semibold"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "کپی شد" : "کپی متن گزارش"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
