import type { Language, Priority, Repeat } from "@/lib/types.ts";

export interface Parsed {
  title: string;
  description?: string | null;
  due: Date | null;
  repeat: Repeat;
  priority: Priority;
  tags: string[];
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnDigits(s: string) {
  return s.replace(/[۰-۹٠-٩]/g, (c) => {
    const i = FA_DIGITS.indexOf(c);
    return String(i === -1 ? AR_DIGITS.indexOf(c) : i);
  });
}

/** Normalize Arabic letters, Persian digits, and zero-width spaces for consistent pattern matching. */
function normalize(s: string) {
  return toEnDigits(s)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏‎]/g, " ")
    .replace(/\s+/g, " ");
}

/** Construct a unicode-aware word boundary regex lookaround */
function word(src: string) {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})(?![\\p{L}\\p{N}])`, "iu");
}

/** Weekday mapping based on Date#getDay (Sunday=0 ... Saturday=6) */
const WEEKDAYS: [RegExp, number][] = [
  [word("یکشنبه|یک شنبه|sunday|sun"), 0],
  [word("دوشنبه|دو شنبه|monday|mon"), 1],
  [word("سه شنبه|سشنبه|tuesday|tue"), 2],
  [word("چهارشنبه|چهار شنبه|wednesday|wed"), 3],
  [word("پنجشنبه|پنج شنبه|thursday|thu"), 4],
  [word("جمعه|friday|fri"), 5],
  [word("شنبه|saturday|sat"), 6],
];

const REPEAT_RULES: [RegExp, Repeat][] = [
  [word("هر ?روز|روزانه|daily|!daily|every day"), "daily"],
  [word("هر ?هفته|هفتگی|weekly|!weekly|every week"), "weekly"],
  [word("هر ?ماه|ماهانه|ماهیانه|monthly|!monthly|every month"), "monthly"],
];

const RE_HIGH_PRIORITY = word(
  "!مهم|!فوری|!urgent|!high|!ضروری|!p1|!1|فوری|خیلی مهم|اولویت بالا|ضروری|urgent|high priority",
);
const RE_MED_PRIORITY = word("!متوسط|!med|!medium|!p2|!2|اولویت متوسط|medium priority");
const RE_LOW_PRIORITY = word("!کم|!low|!p3|!3|اولویت پایین|سر فرصت|هر وقت شد|low priority");

const RE_DAY_AFTER_TOMORROW = word("پس ?فردا|day after tomorrow");
const RE_TOMORROW = word("فردا|tomorrow|tmr");
const RE_TODAY = word("امروز|today");
const RE_WEEKEND = word("آخر هفته|پایان هفته|weekend");
const RE_NEXT_WEEK = word("هفته (?:بعد|آینده|دیگه|دیگر)|next week");

function atTime(base: Date, h: number, m: number) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Parses free-form natural language text into a structured task.
 * Examples:
 * - "Tomorrow 10am team sync !urgent #work // discuss roadmap"
 * - "دوشنبه هفته بعد ساعت ۱۰ کوک کنم !فوری #کار"
 * - "+2h review pull request"
 */
export function parseInput(input: string, now = new Date()): Parsed {
  let description: string | null = null;
  if (input.includes("//")) {
    const parts = input.split("//");
    input = parts[0];
    description = parts.slice(1).join("//").trim() || null;
  }

  let s = normalize(input);
  const tags: string[] = [];

  s = s.replace(/#([^\s#]+)/g, (_, t: string) => {
    tags.push(t);
    return " ";
  });

  // Priority detection
  let priority: Priority = "none";
  if (RE_HIGH_PRIORITY.test(s)) {
    priority = "high";
    s = s.replace(RE_HIGH_PRIORITY, " ");
  } else if (RE_MED_PRIORITY.test(s)) {
    priority = "medium";
    s = s.replace(RE_MED_PRIORITY, " ");
  } else if (RE_LOW_PRIORITY.test(s)) {
    priority = "low";
    s = s.replace(RE_LOW_PRIORITY, " ");
  }

  // Check tags for implicit priority keywords
  if (priority === "none") {
    if (tags.some((t) => /^(مهم|فوری|urgent|high|ضروری)$/i.test(t))) priority = "high";
    else if (tags.some((t) => /^(متوسط|med|medium)$/i.test(t))) priority = "medium";
    else if (tags.some((t) => /^(کم|low)$/i.test(t))) priority = "low";
  }

  // Recurrence rule detection
  let repeat: Repeat = "none";
  for (const [re, r] of REPEAT_RULES) {
    if (re.test(s)) {
      repeat = r;
      s = s.replace(re, " ");
      break;
    }
  }

  // Special relative time expressions
  if (word("نیم ساعت دیگه|نیم ساعت بعد|۳۰ دقیقه دیگه|in 30 min|in 30 minutes|30m").test(s)) {
    s = s.replace(
      word("نیم ساعت دیگه|نیم ساعت بعد|۳۰ دقیقه دیگه|in 30 min|in 30 minutes|30m"),
      " ",
    );
    return {
      title: clean(s),
      description,
      due: new Date(now.getTime() + 30 * 60_000),
      repeat,
      priority,
      tags,
    };
  }
  if (word("یک ربع دیگه|یه ربع دیگه|۱۵ دقیقه دیگه|in 15 min|in 15 minutes|15m").test(s)) {
    s = s.replace(word("یک ربع دیگه|یه ربع دیگه|۱۵ دقیقه دیگه|in 15 min|in 15 minutes|15m"), " ");
    return {
      title: clean(s),
      description,
      due: new Date(now.getTime() + 15 * 60_000),
      repeat,
      priority,
      tags,
    };
  }
  if (word("یک ساعت دیگه|یه ساعت دیگه|۱ ساعت دیگه|in 1 hour|in 1h|1h").test(s)) {
    s = s.replace(word("یک ساعت دیگه|یه ساعت دیگه|۱ ساعت دیگه|in 1 hour|in 1h|1h"), " ");
    return {
      title: clean(s),
      description,
      due: new Date(now.getTime() + 60 * 60_000),
      repeat,
      priority,
      tags,
    };
  }

  // Relative offset: "+2h", "in 2 hours", "10 min later", "3 days from now", "3 روز دیگه"
  const rel =
    /(?:in\s+|\+\s*)?(\d{1,4})\s*(m|min|minute|minutes|دقیقه|h|hr|hour|hours|ساعت|d|day|days|روز|w|week|weeks|هفته)\s*(?:دیگه|دیگر|بعد|later|from now)?/i.exec(
      s,
    );
  const relExplicit =
    rel &&
    (rel[0].trim().startsWith("+") ||
      rel[0].trim().toLowerCase().startsWith("in ") ||
      /دیگه|دیگر|بعد|later|from now/i.test(rel[0]));

  if (rel && relExplicit) {
    const n = Number(rel[1]);
    const unit = rel[2].toLowerCase();
    const d = new Date(now);
    if (/^(m|min|minute|minutes|دقیقه)$/.test(unit)) d.setMinutes(d.getMinutes() + n);
    else if (/^(h|hr|hour|hours|ساعت)$/.test(unit)) d.setHours(d.getHours() + n);
    else if (/^(d|day|days|روز)$/.test(unit)) d.setDate(d.getDate() + n);
    else d.setDate(d.getDate() + n * 7);
    s = s.replace(rel[0], " ");
    return { title: clean(s), description, due: d, repeat, priority, tags };
  }

  let day: Date | null = null;
  let time: { h: number; m: number } | null = null;

  // Absolute date: 1404/07/12 or 2026-09-28
  const abs = /\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/.exec(s);
  if (abs) {
    day = new Date(Number(abs[1]), Number(abs[2]) - 1, Number(abs[3]));
    s = s.replace(abs[0], " ");
  }

  if (!day) {
    if (RE_DAY_AFTER_TOMORROW.test(s)) {
      day = startOfDay(new Date(now.getTime() + 2 * 864e5));
      s = s.replace(RE_DAY_AFTER_TOMORROW, " ");
    } else if (RE_TOMORROW.test(s)) {
      day = startOfDay(new Date(now.getTime() + 864e5));
      s = s.replace(RE_TOMORROW, " ");
    } else if (RE_TODAY.test(s)) {
      day = startOfDay(now);
      s = s.replace(RE_TODAY, " ");
    } else if (RE_WEEKEND.test(s)) {
      const d = startOfDay(now);
      const delta = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + delta);
      day = d;
      s = s.replace(RE_WEEKEND, " ");
    }
  }

  if (!day) {
    const nextWeek = RE_NEXT_WEEK.test(s);
    if (nextWeek) s = s.replace(RE_NEXT_WEEK, " ");
    for (const [re, target] of WEEKDAYS) {
      if (re.test(s)) {
        s = s.replace(re, " ");
        const d = startOfDay(now);
        let delta = (target - d.getDay() + 7) % 7;
        if (delta === 0) delta = 7;
        d.setDate(d.getDate() + delta + (nextWeek ? 7 : 0));
        day = d;
        break;
      }
    }
    if (!day && nextWeek) day = startOfDay(new Date(now.getTime() + 7 * 864e5));
  }

  // Named day time intervals: morning (8:30), noon (12:30), afternoon (17:00), evening (19:00), night (21:00), midnight (23:00)
  if (word("اول صبح|early morning").test(s)) {
    time = { h: 7, m: 0 };
    s = s.replace(word("اول صبح|early morning"), " ");
  } else if (word("آخر شب|نیمه شب|midnight").test(s)) {
    time = { h: 23, m: 0 };
    s = s.replace(word("آخر شب|نیمه شب|midnight"), " ");
  } else if (word("غروب|evening").test(s)) {
    time = { h: 19, m: 0 };
    s = s.replace(word("غروب|evening"), " ");
  } else if (word("عصر|afternoon").test(s) && !/ساعت|at\s+\d/.test(s)) {
    time = { h: 17, m: 0 };
    s = s.replace(word("عصر|afternoon"), " ");
  } else if (word("ظهر|noon|midday").test(s) && !/ساعت|at\s+\d/.test(s)) {
    time = { h: 12, m: 30 };
    s = s.replace(word("ظهر|noon|midday"), " ");
  } else if (word("صبح|morning").test(s) && !/ساعت|at\s+\d/.test(s)) {
    time = { h: 8, m: 30 };
    s = s.replace(word("صبح|morning"), " ");
  } else if (word("شب|tonight|night").test(s) && !/ساعت|at\s+\d/.test(s)) {
    time = { h: 21, m: 0 };
    s = s.replace(word("شب|tonight|night"), " ");
  }

  // Explicit time: "at 10:30", "10:30am", "9pm", "ساعت 10", "۸ صبح"
  const t = /(?:ساعت\s*|at\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|صبح|ظهر|عصر|شب|بعدازظهر)?/i.exec(
    s,
  );
  if (t && (/ساعت|at|[:.]|am|pm|صبح|ظهر|عصر|شب|بعدازظهر/i.test(t[0]) || day)) {
    let h = Number(t[1]);
    const m = t[2] ? Number(t[2]) : 0;
    const suffix = (t[3] || "").toLowerCase();
    if (h <= 23 && m <= 59) {
      if (suffix === "pm" || /عصر|شب|بعدازظهر/.test(suffix)) {
        if (h < 12) h += 12;
      } else if ((suffix === "am" || suffix === "صبح") && h === 12) {
        h = 0;
      }
      time = { h, m };
      s = s.replace(t[0], " ");
    }
  }

  let due: Date | null = null;
  if (day && time) due = atTime(day, time.h, time.m);
  else if (day) due = atTime(day, 9, 0);
  else if (time) {
    due = atTime(now, time.h, time.m);
    if (due.getTime() <= now.getTime()) due = new Date(due.getTime() + 864e5);
  }

  return { title: clean(s), description, due, repeat, priority, tags };
}

function clean(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/^[\s,،.:-]+|[\s,،.:-]+$/g, "")
    .trim();
}

/** Formats a deadline into localized relative string (e.g., 'Tomorrow at 9:00 AM' / 'فردا ۹:۰۰') */
export function formatDue(iso: string | null, lang: Language = "fa", now = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const isFa = lang === "fa";
  const days = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 864e5);

  if (isFa) {
    const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    if (days === 0) return `امروز ${time}`;
    if (days === 1) return `فردا ${time}`;
    if (days === -1) return `دیروز ${time}`;
    if (days > 1 && days < 7)
      return `${d.toLocaleDateString("fa-IR", { weekday: "long" })} ${time}`;
    return `${d.toLocaleDateString("fa-IR", { month: "long", day: "numeric" })} ${time}`;
  }

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Tomorrow ${time}`;
  if (days === -1) return `Yesterday ${time}`;
  if (days > 1 && days < 7) return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}
