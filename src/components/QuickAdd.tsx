import { Input } from "@/components/ui/input.tsx";
import { Kbd } from "@/components/ui/kbd.tsx";
import { unlockAudio } from "@/lib/notify.ts";
import { formatDue, parseInput } from "@/lib/parse.ts";
import { getTagStyle } from "@/lib/tags.ts";
import { cn } from "@/lib/utils.ts";
import { AlignLeft, Clock, Flame, Hash, Repeat, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface SuggestionItem {
  id: string;
  type: "tag" | "priority" | "date" | "repeat" | "desc";
  insertText: string;
  displayTitle: string;
  categoryLabel: string;
  tagColor?: ReturnType<typeof getTagStyle>;
  priorityColor?: string;
}

const DEFAULT_TAGS = [
  "کار",
  "پروژه",
  "شخصی",
  "خرید",
  "مالی",
  "جلسه",
  "سلامتی",
  "ورزش",
  "مطالعه",
  "ایده",
  "توسعه",
];

const DATE_SUGGESTIONS = [
  { text: "فردا ۹:۰۰", label: "فردا صبح ساعت ۹" },
  { text: "فردا عصر", label: "فردا ساعت ۱۷:۰۰" },
  { text: "امروز ۱۸:۰۰", label: "امروز عصر ساعت ۱۸" },
  { text: "شنبه ۹:۰۰", label: "شنبه آینده ساعت ۹:۰۰" },
  { text: "آخر هفته", label: "پنج‌شنبه ساعت ۹:۰۰" },
  { text: "نیم ساعت دیگه", label: "۳۰ دقیقه بعد" },
  { text: "یک ربع دیگه", label: "۱۵ دقیقه بعد" },
];

const REPEAT_SUGGESTIONS = [
  { text: "هر روز", label: "تکرار روزانه" },
  { text: "هر هفته", label: "تکرار هفتگی" },
  { text: "هر ماه", label: "تکرار ماهانه" },
];

interface Props {
  onAdd: (raw: string) => void;
  existingTags?: string[];
}

export function QuickAdd({ onAdd, existingTags = [] }: Props) {
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const preview = useMemo(() => (value.trim() ? parseInput(value) : null), [value]);

  // استخراج کلمه فعال در موقعیت نشانگر
  const activeWordInfo = useMemo(() => {
    if (!value) return { word: "", start: 0, end: 0 };
    const cursor = ref.current?.selectionStart ?? value.length;
    const left = value.slice(0, cursor);
    const right = value.slice(cursor);

    const leftMatch = left.match(/[^\s]+$/);
    const rightMatch = right.match(/^[^\s]+/);

    const start = leftMatch ? cursor - leftMatch[0].length : cursor;
    const end = rightMatch ? cursor + rightMatch[0].length : cursor;
    const word = value.slice(start, end);

    return { word, start, end };
  }, [value]);

  // محاسبه لیست پیشنهادهای هوشمند
  const suggestions = useMemo<SuggestionItem[]>(() => {
    const rawWord = activeWordInfo.word.trim();
    if (!rawWord && !value.trim()) return [];

    const items: SuggestionItem[] = [];

    // ۱. پیشنهاد هشتگ و برچسب‌ها (#)
    if (rawWord.startsWith("#")) {
      const query = rawWord.replace(/^#/, "").toLowerCase();
      const allTagsPool = Array.from(new Set([...DEFAULT_TAGS, ...existingTags]));
      const matched = allTagsPool.filter((t) => t.toLowerCase().includes(query));

      matched.slice(0, 7).forEach((t) => {
        items.push({
          id: `tag-${t}`,
          type: "tag",
          insertText: `#${t}`,
          displayTitle: `#${t}`,
          categoryLabel: "برچسب",
          tagColor: getTagStyle(t),
        });
      });

      // اگر تگ جدیدی تایپ کرده که در لیست نیست، امکان ساخت پیشنهاد شود
      if (query && !matched.some((t) => t.toLowerCase() === query)) {
        items.push({
          id: `tag-custom-${query}`,
          type: "tag",
          insertText: `#${query}`,
          displayTitle: `#${query}`,
          categoryLabel: "برچسب جدید",
          tagColor: getTagStyle(query),
        });
      }
    }

    // ۲. پیشنهاد اولویت‌ها (! یا کلمات اولویت)
    const isPriorityTrigger =
      rawWord.startsWith("!") ||
      ["اول", "اولویت", "فور", "فوری", "ضرور", "مهم"].some((p) => rawWord.includes(p));

    if (isPriorityTrigger) {
      items.push(
        {
          id: "p-high",
          type: "priority",
          insertText: "!فوری",
          displayTitle: "!فوری",
          categoryLabel: "اولویت بالا",
          priorityColor: "text-red-400",
        },
        {
          id: "p-medium",
          type: "priority",
          insertText: "!متوسط",
          displayTitle: "!متوسط",
          categoryLabel: "اولویت متوسط",
          priorityColor: "text-amber-400",
        },
        {
          id: "p-low",
          type: "priority",
          insertText: "!کم",
          displayTitle: "!کم",
          categoryLabel: "اولویت پایین",
          priorityColor: "text-blue-400",
        },
      );
    }

    // ۳. پیشنهاد تاریخ و زمان
    const dateTriggers = [
      "فرد",
      "امرو",
      "ساع",
      "هفت",
      "شنب",
      "دوش",
      "سه",
      "چها",
      "پنج",
      "جمع",
      "پس",
      "صبح",
      "عصر",
      "شب",
      "ربع",
      "دقیق",
    ];
    if (dateTriggers.some((dt) => rawWord.includes(dt))) {
      DATE_SUGGESTIONS.filter(
        (ds) => ds.text.includes(rawWord) || ds.label.includes(rawWord) || rawWord.length < 3,
      )
        .slice(0, 4)
        .forEach((ds) => {
          items.push({
            id: `date-${ds.text}`,
            type: "date",
            insertText: ds.text,
            displayTitle: ds.text,
            categoryLabel: ds.label,
          });
        });
    }

    // ۴. پیشنهاد تکرار
    if (rawWord.startsWith("هر") || rawWord.includes("تکر")) {
      REPEAT_SUGGESTIONS.forEach((rs) => {
        items.push({
          id: `repeat-${rs.text}`,
          type: "repeat",
          insertText: rs.text,
          displayTitle: rs.text,
          categoryLabel: rs.label,
        });
      });
    }

    // ۵. پیشنهاد توضیحات تسک
    if (rawWord.startsWith("/") || rawWord.includes("توضیح")) {
      items.push({
        id: "desc-help",
        type: "desc",
        insertText: "// ",
        displayTitle: "// توضیحات بیشتر",
        categoryLabel: "یادداشت ثانویه تسک",
      });
    }

    return items;
  }, [activeWordInfo.word, value, existingTags]);

  useEffect(() => {
    setIsOpen(suggestions.length > 0);
    setActiveIndex(-1);
  }, [suggestions]);

  // جایگزینی کلمه فعال با پیشنهاد انتخاب شده
  const applySuggestion = (item: SuggestionItem) => {
    if (!ref.current) return;
    const { start, end } = activeWordInfo;

    const before = value.slice(0, start).trimEnd();
    const after = value.slice(end).trimStart();

    const insert = item.insertText;
    const newValue = (before ? before + " " : "") + insert + (after ? " " + after : " ");

    setValue(newValue);
    setIsOpen(false);
    setActiveIndex(-1);

    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        const cursorPosition = (before ? before + " " : "").length + insert.length + 1;
        ref.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  return (
    <div className="relative">
      <Input
        ref={ref}
        id="quick-add-input"
        autoFocus
        value={value}
        placeholder="چی یادت نره؟  مثلاً: فردا ساعت ۱۰ جلسه فنی !فوری #کار"
        onChange={(e) => setValue(e.target.value)}
        onFocus={unlockAudio}
        onKeyDown={(e) => {
          if (isOpen && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((prev) => (prev + 1) % suggestions.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
              return;
            }
            if (e.key === "Tab") {
              e.preventDefault();
              const target = suggestions[activeIndex >= 0 ? activeIndex : 0];
              if (target) applySuggestion(target);
              return;
            }
            if (e.key === "Enter" && activeIndex >= 0) {
              e.preventDefault();
              applySuggestion(suggestions[activeIndex]);
              return;
            }
          }

          if (e.key === "Enter" && value.trim()) {
            onAdd(value);
            setValue("");
            setIsOpen(false);
          }
          if (e.key === "Escape") {
            if (isOpen) {
              setIsOpen(false);
            } else {
              setValue("");
              ref.current?.blur();
            }
          }
        }}
        className="h-14 rounded-xl border-zinc-700/80 bg-zinc-900/90 pe-14 ps-4 text-base font-normal shadow-sm placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300"
      />

      <div className="pointer-events-none absolute end-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        <Kbd size="xs" className="hidden sm:inline-flex text-zinc-400">
          /
        </Kbd>
        <Kbd size="xs" className="text-zinc-400">
          ↵
        </Kbd>
      </div>

      {/* منوی شناور پیشنهادهای هوشمند */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute start-0 end-0 top-full z-40 mt-1.5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md"
        >
          <div className="mb-1 flex items-center justify-between px-2.5 py-1 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="size-3 text-amber-400" />
              پیشنهادهای هوشمند
            </span>
            <span className="flex items-center gap-1 text-[10px] text-zinc-400">
              با <Kbd size="xs">Tab</Kbd> یا <Kbd size="xs">↵</Kbd> تکمیل کنید
            </span>
          </div>

          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {suggestions.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(item);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-xs transition-colors text-start",
                    isSelected
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-200 hover:bg-zinc-900 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === "tag" && (
                      <span className="flex items-center gap-1 font-semibold text-zinc-100">
                        {item.tagColor && (
                          <span className={cn("size-2 rounded-full", item.tagColor.dot)} />
                        )}
                        <Hash className="size-3.5 text-zinc-400" />
                        <span>{item.displayTitle.replace(/^#/, "")}</span>
                      </span>
                    )}

                    {item.type === "priority" && (
                      <span
                        className={cn(
                          "flex items-center gap-1.5 font-semibold",
                          item.priorityColor,
                        )}
                      >
                        <Flame className="size-3.5" />
                        <span>{item.displayTitle}</span>
                      </span>
                    )}

                    {item.type === "date" && (
                      <span className="flex items-center gap-1.5 font-mono text-zinc-100">
                        <Clock className="size-3.5 text-emerald-400" />
                        <span>{item.displayTitle}</span>
                      </span>
                    )}

                    {item.type === "repeat" && (
                      <span className="flex items-center gap-1.5 font-medium text-purple-300">
                        <Repeat className="size-3.5 text-purple-400" />
                        <span>{item.displayTitle}</span>
                      </span>
                    )}

                    {item.type === "desc" && (
                      <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                        <AlignLeft className="size-3.5 text-zinc-400" />
                        <span>{item.displayTitle}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-zinc-400">{item.categoryLabel}</span>
                    {isSelected && <Kbd size="xs">Tab</Kbd>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* پیش‌نمایش پارس شده از ورودی */}
      {preview && !isOpen && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 px-1 text-xs">
          <span className="font-semibold text-zinc-100">{preview.title || "…"}</span>
          {preview.priority === "high" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-red-800/80 bg-red-950/80 px-2 py-0.5 text-[11px] font-semibold text-red-300">
              <Flame className="size-3 text-red-400" />
              فوری
            </span>
          )}
          {preview.priority === "medium" && (
            <span className="inline-flex items-center rounded-md border border-amber-800/80 bg-amber-950/80 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              اولویت متوسط
            </span>
          )}
          {preview.due && (
            <span className="rounded-md bg-white px-2.5 py-0.5 font-semibold text-black shadow-xs">
              {formatDue(preview.due.toISOString())}
            </span>
          )}
          {preview.repeat !== "none" && (
            <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-zinc-300">
              {{ daily: "هر روز", weekly: "هر هفته", monthly: "هر ماه" }[preview.repeat]}
            </span>
          )}
          {preview.tags.map((t) => {
            const style = getTagStyle(t);
            return (
              <span
                key={t}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                  style.bg,
                  style.text,
                  style.border,
                )}
              >
                <span className={cn("size-1.5 rounded-full", style.dot)} />#{t}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
