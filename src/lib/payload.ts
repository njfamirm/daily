import type { DB } from "@/lib/types.ts";

const SPEC = `# daily — کل وضعیت من

تو یک دستیار ویرایش داده‌ای. پایین، کل دیتای اپ «daily» است.
daily یک لیست تعهدهای کوچکِ تکرارشونده است که هدفش «فراموش‌نکردن» است، نه مدیریت پروژه.
تسک‌ها موعد (due) دارند و اپ سر موعد نوتیف + صدا + بج روی favicon می‌دهد.

## قوانین ویرایش
- فقط و فقط یک بلوک JSON معتبر برگردان، بدون توضیح اضافه یا متن قبل/بعد. من مستقیم پیستش می‌کنم.
- ساختار و کلیدها را دقیقاً حفظ کن. کلید جدید اضافه نکن.
- \`due\` رشته ISO 8601 با آفست محلی است (مثل "2026-09-28T10:00:00+03:30")؛ اگر تسک زمان ندارد null.
- \`repeat\`: یکی از "none" | "daily" | "weekly" | "monthly".
- \`priority\`: یکی از "none" | "low" | "medium" | "high".
- \`id\`های موجود را عوض نکن؛ برای آیتم جدید یک رشته کوتاه یکتا بساز.
- \`notes\` یادداشت‌های ثابت‌اند که همیشه بالای صفحه دیده می‌شوند (مثل «گسترش به تلگرام»). تسک نیستند.
- فیلد \`aiMemory\` دستورالعمل‌های همیشگی من برای تو است؛ آن را حفظ کن مگر اینکه از تو بخواهم آپدیتش کنی.
- تاریخ‌های نسبی («دوشنبه هفته بعد ساعت ۱۰») را نسبت به «زمان حال» پایین حساب کن.
- \`done: true\` یعنی انجام‌شده؛ برای پاک‌کردن، آیتم را از آرایه حذف کن.

## اسکیمای تسک
{ "id": string, "title": string, "due": string|null, "repeat": "none"|"daily"|"weekly"|"monthly",
  "priority": "none"|"low"|"medium"|"high", "done": boolean, "createdAt": string,
  "doneAt": string|null, "notifiedAt": string|null, "tags": string[] }

## اسکیمای یادداشت
{ "id": string, "text": string, "createdAt": string }

## تنظیمات و حافظه
{ "version": 1, "settings": { "sound": boolean, "notifications": boolean, "checkIntervalSec": number, "leadMinutes": number }, "aiMemory": string, "notes": Note[], "tasks": Task[] }
`;

function localISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const oh = pad(Math.floor(Math.abs(off) / 60));
  const om = pad(Math.abs(off) % 60);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`
  );
}

/** متن کاملی که برای AI کپی می‌شود: توضیح هدف + اسکیما + حافظه AI + کل دیتا. */
export function buildPayload(db: DB): string {
  const now = new Date();
  const weekday = now.toLocaleDateString("fa-IR", { weekday: "long" });
  const memorySection = db.aiMemory?.trim()
    ? `\n## 🧠 حافظه و دستورالعمل‌های همیشگی من به تو (AI Memory):\n${db.aiMemory.trim()}\n`
    : "";

  return `${SPEC}${memorySection}\n## زمان حال\n${localISO(now)} (${weekday}) — تایم‌زون ${
    Intl.DateTimeFormat().resolvedOptions().timeZone
  }\n\n## دیتا\n\`\`\`json\n${JSON.stringify(db, null, 2)}\n\`\`\`\n`;
}
