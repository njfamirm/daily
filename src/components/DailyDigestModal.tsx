import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import { formatDue } from "@/lib/parse.ts";
import type { DB, Language } from "@/lib/types.ts";
import { Check, Copy, FileText } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  open: boolean;
  db: DB;
  lang?: Language;
  onClose: () => void;
  onMessage: (msg: string) => void;
}

export function DailyDigestModal({ open, db, lang = "fa", onClose, onMessage }: Props) {
  const t = getTranslation(lang);
  const isFa = lang === "fa";
  const [copied, setCopied] = useState(false);

  const digestText = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString(isFa ? "fa-IR" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 864e5 - 1;
    const startOfTomorrow = endOfToday + 1;
    const endOfTomorrow = startOfTomorrow + 864e5 - 1;

    // Completed today
    const doneToday = db.tasks.filter((task) => {
      if (!task.doneAt) return false;
      const doneTime = new Date(task.doneAt).getTime();
      return doneTime >= startOfToday && doneTime <= endOfToday;
    });

    // Open tasks for today or overdue
    const openToday = db.tasks.filter((task) => {
      if (task.done) return false;
      if (!task.due) return false;
      const dueTime = new Date(task.due).getTime();
      return dueTime <= endOfToday;
    });

    // Upcoming tasks for tomorrow
    const tomorrowTasks = db.tasks.filter((task) => {
      if (task.done) return false;
      if (!task.due) return false;
      const dueTime = new Date(task.due).getTime();
      return dueTime >= startOfTomorrow && dueTime <= endOfTomorrow;
    });

    let md = `${t.digestHeader} — ${dateStr}\n\n`;

    // Completed Section
    md += `${t.digestCompletedSection(doneToday.length)}\n`;
    if (doneToday.length === 0) {
      md += `${t.digestNoCompleted}\n`;
    } else {
      for (const task of doneToday) {
        const tagStr = task.tags.length > 0 ? ` [${task.tags.map((x) => `#${x}`).join(" ")}]` : "";
        const descStr =
          task.description && task.description.trim()
            ? `\n    ↳ _${isFa ? "خلاصه" : "Summary"}_: ${task.description.trim()}`
            : "";
        md += `- [x] ${task.title}${tagStr}${descStr}\n`;
      }
    }
    md += "\n";

    // Remaining Section
    if (openToday.length > 0) {
      md += `${t.digestRemainingSection(openToday.length)}\n`;
      for (const task of openToday) {
        const pStr = task.priority === "high" ? (isFa ? " [فوری]" : " [Urgent]") : "";
        const tagStr = task.tags.length > 0 ? ` [${task.tags.map((x) => `#${x}`).join(" ")}]` : "";
        md += `- [ ] ${task.title}${pStr}${tagStr} (${formatDue(task.due, lang)})\n`;
      }
      md += "\n";
    }

    // Tomorrow Section
    if (tomorrowTasks.length > 0) {
      md += `${t.digestTomorrowSection(tomorrowTasks.length)}\n`;
      for (const task of tomorrowTasks) {
        const pStr = task.priority === "high" ? (isFa ? " [فوری]" : " [Urgent]") : "";
        const tagStr = task.tags.length > 0 ? ` [${task.tags.map((x) => `#${x}`).join(" ")}]` : "";
        md += `- [ ] ${task.title}${pStr}${tagStr}\n`;
      }
      md += "\n";
    }

    // Pinned Notes
    if (db.notes.length > 0) {
      md += `${t.digestNotesSection}\n`;
      for (const note of db.notes) {
        md += `- ${note.text}\n`;
      }
      md += "\n";
    }

    md += t.digestFooter;
    return md;
  }, [db, isFa, lang, t]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(digestText);
      setCopied(true);
      onMessage(t.digestCopySuccess);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onMessage(t.digestCopyFail);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <FileText className="size-4" />
            </div>
            <div>
              <DialogTitle>{t.digestTitle}</DialogTitle>
              <DialogDescription>{t.digestDesc}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative my-2">
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 font-mono text-xs leading-6 text-zinc-200">
            {digestText}
          </pre>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs">
          <span className="text-[11px] text-zinc-500">{t.digestStandardMd}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t.close}
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold cursor-pointer"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? t.digestCopied : t.digestCopy}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
