import type { DB } from "@/lib/types.ts";

const SPEC = `# daily — کل وضعیت من

تو یک دستیار ویرایش داده‌ای. پایین، کل دیتای اپ «daily» است.
daily یک لیست تعهدهای کوچک، سریع و تکرارشونده است که هدفش «فراموش‌نکردن» است، نه مدیریت پروژه پیچیده.
تسک‌ها موعد (due) دارند و اپ سر موعد نوتیف + صدا + بج روی favicon می‌دهد.

## قوانین حیاتی و مهم
1. 🎯 **متن عنوان تسک (\`title\`) باید بسیار کوتاه، واضح، ضربتی و تیتروار باشد (۳ تا ۶ کلمه، حداکثر ۸ کلمه).**
   - عنوان تسک در اپلیکیشن بسیار بزرگ و برجسته نمایش داده می‌شود.
2. 📝 **توضیحات تکمیلی (\`description\`):**
   - فقط و فقط در صورتی که تسک نیاز به یک توضیح تکمیلی ضروری، جزئیات، آدرس یا لینک دارد فیلد \`description\` را پر کن.
   - در ۹۰٪ مواقع که نیازی به توضیح نیست، \`"description": null\` بگذار تا تسک خلوت و مینیمال بماند.
3. 🚨 **اولویت‌بندی دقیق**:
   - تسک‌های فوری و حیاتی را حتماً با \`"priority": "high"\` مشخص کن تا بالای صفحه در دید قرار گیرند.
   - تسک‌های دارای اهمیت استاندارد را \`"priority": "medium"\` یا \`"none"\` بگذار.
4. 📦 **فقط و فقط یک بلوک JSON معتبر برگردان**، بدون هیچ توضیح، احوالپرسی یا متن اضافه قبل/بعد.
5. ساختار و کلیدها را دقیقاً حفظ کن. کلید جدید اضافه نکن.
6. \`due\` رشته ISO 8601 با آفست محلی است (مثل "2026-09-28T10:00:00+03:30")؛ اگر تسک زمان ندارد null.
7. \`repeat\`: یکی از "none" | "daily" | "weekly" | "monthly".
8. \`priority\`: یکی از "none" | "low" | "medium" | "high".
9. \`id\`های موجود را عوض نکن؛ برای آیتم جدید یک رشته کوتاه یکتا بساز.
10. \`notes\` یادداشت‌های ثابت‌اند که بالای صفحه دیده می‌شوند (مثل «گسترش به تلگرام»).
11. فیلد \`aiMemory\` دستورالعمل‌های همیشگی من برای تو است؛ آن را حفظ کن مگر اینکه از تو بخواهم آپدیتش کنی.
12. تاریخ‌های نسبی («دوشنبه هفته بعد ساعت ۱۰») را نسبت به «زمان حال» پایین حساب کن.
13. \`done: true\` یعنی انجام‌شده؛ برای پاک‌کردن، آیتم را از آرایه حذف کن.

## اسکیمای تسک
{ "id": string, "title": string, "description": string|null, "due": string|null, "repeat": "none"|"daily"|"weekly"|"monthly",
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
