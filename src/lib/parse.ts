import type { Priority, Repeat } from "@/lib/types.ts";

export interface Parsed {
  title: string;
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

/** ی/ک عربی و نیم‌فاصله را یکدست می‌کند تا تطبیق الگوها قابل‌اتکا باشد. */
function normalize(s: string) {
  return toEnDigits(s)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏‎]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * `\b` در جاوااسکریپت روی حروف فارسی کار نمی‌کند (فقط [A-Za-z0-9_] را واژه می‌داند)،
 * پس مرز واژه را با lookaround یونیکدی می‌سازیم.
 */
function word(src: string) {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})(?![\\p{L}\\p{N}])`, "u");
}

/** شنبه=6 … جمعه=5 بر مبنای Date#getDay */
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
  [word("هر ?روز|روزانه|daily|!daily"), "daily"],
  [word("هر ?هفته|هفتگی|weekly|!weekly"), "weekly"],
  [word("هر ?ماه|ماهانه|ماهیانه|monthly|!monthly"), "monthly"],
];

const RE_HIGH_PRIORITY = word(
  "!مهم|!فوری|!urgent|!high|!ضروری|!p1|!1|فوری|خیلی مهم|اولویت بالا|ضروری",
);
const RE_MED_PRIORITY = word("!متوسط|!med|!medium|!p2|!2|اولویت متوسط");
const RE_LOW_PRIORITY = word("!کم|!low|!p3|!3|اولویت پایین|سر فرصت|هر وقت شد");

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
 * یک خط ورودی را به تسک تبدیل می‌کند.
 * مثال: «دوشنبه هفته بعد ساعت ۱۰ کوک کنم !فوری #کار» یا «+۲ ساعت دیگه چک کن آپدیت رو».
 */
export function parseInput(input: string, now = new Date()): Parsed {
  let s = normalize(input);
  const tags: string[] = [];

  s = s.replace(/#([^\s#]+)/g, (_, t: string) => {
    tags.push(t);
    return " ";
  });

  // اولویت
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

  // اگر در تگ‌ها کلمه مهم یا فوری بود اولویت بالا اعمال شود
  if (priority === "none") {
    if (tags.some((t) => /^(مهم|فوری|urgent|ضروری)$/i.test(t))) priority = "high";
    else if (tags.some((t) => /^(متوسط|med)$/i.test(t))) priority = "medium";
    else if (tags.some((t) => /^(کم|low)$/i.test(t))) priority = "low";
  }

  let repeat: Repeat = "none";
  for (const [re, r] of REPEAT_RULES) {
    if (re.test(s)) {
      repeat = r;
      s = s.replace(re, " ");
      break;
    }
  }

  let day: Date | null = null;
  let time: { h: number; m: number } | null = null;

  // عبارت‌های زمانی متنی خاص مثل «نیم ساعت دیگه»، «یک ربع دیگه»
  if (word("نیم ساعت دیگه|نیم ساعت بعد|۳۰ دقیقه دیگه").test(s)) {
    s = s.replace(word("نیم ساعت دیگه|نیم ساعت بعد|۳۰ دقیقه دیگه"), " ");
    return { title: clean(s), due: new Date(now.getTime() + 30 * 60_000), repeat, priority, tags };
  }
  if (word("یک ربع دیگه|یه ربع دیگه|۱۵ دقیقه دیگه").test(s)) {
    s = s.replace(word("یک ربع دیگه|یه ربع دیگه|۱۵ دقیقه دیگه"), " ");
    return { title: clean(s), due: new Date(now.getTime() + 15 * 60_000), repeat, priority, tags };
  }
  if (word("یک ساعت دیگه|یه ساعت دیگه|۱ ساعت دیگه").test(s)) {
    s = s.replace(word("یک ساعت دیگه|یه ساعت دیگه|۱ ساعت دیگه"), " ");
    return { title: clean(s), due: new Date(now.getTime() + 60 * 60_000), repeat, priority, tags };
  }

  // «+2h» / «۲ ساعت دیگه» / «۱۰ دقیقه دیگه» / «3 روز دیگه»
  const rel =
    /(?:\+\s*)?(\d{1,4})\s*(m|min|دقیقه|h|hr|ساعت|d|day|روز|w|week|هفته)\s*(?:دیگه|دیگر|بعد|later|from now)?/.exec(
      s,
    );
  const relExplicit =
    rel && (rel[0].trim().startsWith("+") || /دیگه|دیگر|بعد|later|from now/.test(rel[0]));
  if (rel && relExplicit) {
    const n = Number(rel[1]);
    const unit = rel[2];
    const d = new Date(now);
    if (/^(m|min|دقیقه)$/.test(unit)) d.setMinutes(d.getMinutes() + n);
    else if (/^(h|hr|ساعت)$/.test(unit)) d.setHours(d.getHours() + n);
    else if (/^(d|day|روز)$/.test(unit)) d.setDate(d.getDate() + n);
    else d.setDate(d.getDate() + n * 7);
    s = s.replace(rel[0], " ");
    return { title: clean(s), due: d, repeat, priority, tags };
  }

  // تاریخ مطلق: 1404/07/12 یا 2026-09-28
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
      // پنجشنبه
      const d = startOfDay(now);
      const delta = (4 - d.getDay() + 7) % 7 || 7;
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
        if (delta === 0) delta = 7; // «دوشنبه» یعنی دوشنبهٔ بعدی، نه امروز
        d.setDate(d.getDate() + delta + (nextWeek ? 7 : 0));
        day = d;
        break;
      }
    }
    if (!day && nextWeek) day = startOfDay(new Date(now.getTime() + 7 * 864e5));
  }

  // زمان‌های نام‌دار روز: اول صبح (7:00)، صبح (8:30)، ظهر (12:30)، عصر (17:00)، غروب (19:00)، شب (21:00)، آخر شب (23:00)
  if (word("اول صبح").test(s)) {
    time = { h: 7, m: 0 };
    s = s.replace(word("اول صبح"), " ");
  } else if (word("آخر شب|نیمه شب").test(s)) {
    time = { h: 23, m: 0 };
    s = s.replace(word("آخر شب|نیمه شب"), " ");
  } else if (word("غروب").test(s)) {
    time = { h: 19, m: 0 };
    s = s.replace(word("غروب"), " ");
  } else if (word("عصر").test(s) && !/ساعت/.test(s)) {
    time = { h: 17, m: 0 };
    s = s.replace(word("عصر"), " ");
  } else if (word("ظهر").test(s) && !/ساعت/.test(s)) {
    time = { h: 12, m: 30 };
    s = s.replace(word("ظهر"), " ");
  } else if (word("صبح").test(s) && !/ساعت/.test(s)) {
    time = { h: 8, m: 30 };
    s = s.replace(word("صبح"), " ");
  } else if (word("شب").test(s) && !/ساعت/.test(s)) {
    time = { h: 21, m: 0 };
    s = s.replace(word("شب"), " ");
  }

  // ساعت عددی: «ساعت 10»، «10:30»، «at 9:15»، «۸ صبح»، «9pm»
  const t = /(?:ساعت\s*|at\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|صبح|ظهر|عصر|شب|بعدازظهر)?/.exec(
    s,
  );
  if (t && (/ساعت|at|[:.]|am|pm|صبح|ظهر|عصر|شب|بعدازظهر/.test(t[0]) || day)) {
    let h = Number(t[1]);
    const m = t[2] ? Number(t[2]) : 0;
    const suffix = t[3];
    if (h <= 23 && m <= 59) {
      if (suffix === "pm" || /عصر|شب|بعدازظهر/.test(suffix ?? "")) {
        if (h < 12) h += 12;
      } else if ((suffix === "am" || suffix === "صبح") && h === 12) h = 0;
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

  return { title: clean(s), due, repeat, priority, tags };
}

function clean(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/^[\s,،.:-]+|[\s,،.:-]+$/g, "")
    .trim();
}

export function formatDue(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 864e5);
  const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `امروز ${time}`;
  if (days === 1) return `فردا ${time}`;
  if (days === -1) return `دیروز ${time}`;
  if (days > 1 && days < 7) return `${d.toLocaleDateString("fa-IR", { weekday: "long" })} ${time}`;
  return `${d.toLocaleDateString("fa-IR", { month: "long", day: "numeric" })} ${time}`;
}
