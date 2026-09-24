import type { DB, Task } from "@/lib/types.ts";

/**
 * الگوریتم ادغام هوشمند دو دیتابیس بدون از دست رفتن اطلاعات (Conflict-Free Merge)
 */
export function mergeDBs(local: DB, incoming: DB): DB {
  // ۱. ساخت مپ برای تسک‌ها بر اساس شناسه id
  const taskMap = new Map<string, Task>();

  // اضافه کردن تسک‌های محلی
  for (const t of local.tasks) {
    taskMap.set(t.id, t);
  }

  // ادغام تسک‌های ورودی
  for (const inTask of incoming.tasks) {
    const locTask = taskMap.get(inTask.id);
    if (!locTask) {
      // تسک جدید است، اضافه می‌شود
      taskMap.set(inTask.id, inTask);
    } else {
      // تسک در هر دو وجود دارد؛ تعیین وضعیت جدیدتر بر اساس doneAt یا createdAt
      const locTime = new Date(locTask.doneAt || locTask.createdAt).getTime();
      const inTime = new Date(inTask.doneAt || inTask.createdAt).getTime();

      if (inTime > locTime) {
        taskMap.set(inTask.id, inTask);
      } else {
        // اگر محلی جدیدتر بود یا برابر بود، فیلدهای تکمیلی حفظ می‌شوند
        taskMap.set(locTask.id, {
          ...locTask,
          description: inTask.description ?? locTask.description,
          tags: Array.from(new Set([...locTask.tags, ...inTask.tags])),
        });
      }
    }
  }

  // ۲. ادغام یادداشت‌ها
  const noteIds = new Set(local.notes.map((n) => n.id));
  const mergedNotes = [...local.notes];
  for (const inNote of incoming.notes) {
    if (!noteIds.has(inNote.id)) {
      mergedNotes.push(inNote);
      noteIds.add(inNote.id);
    }
  }

  // ۳. حافظه هوش مصنوعی (در صورت پر بودن ورودی، ادغام می‌شود)
  let mergedMemory = local.aiMemory || "";
  if (incoming.aiMemory?.trim() && incoming.aiMemory !== local.aiMemory) {
    mergedMemory = local.aiMemory?.trim()
      ? `${local.aiMemory.trim()}\n${incoming.aiMemory.trim()}`
      : incoming.aiMemory.trim();
  }

  return {
    version: 1,
    settings: {
      ...local.settings,
      ...incoming.settings,
    },
    aiMemory: mergedMemory,
    notes: mergedNotes,
    tasks: Array.from(taskMap.values()),
  };
}
