import type { DB, Note, Task } from "@/lib/types.ts";

const TOMBSTONE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // ۳۰ روز نگهداری رد حذف

function getTaskTime(t: Task): number {
  const dateStr = t.updatedAt || t.doneAt || t.createdAt;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getNoteTime(n: Note): number {
  const dateStr = n.updatedAt || n.createdAt;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * الگوریتم ادغام هوشمند دو دیتابیس بدون از دست رفتن اطلاعات (Conflict-Free LWW with Tombstones)
 */
export function mergeDBs(local: DB, incoming: DB): DB {
  const now = Date.now();
  const taskMap = new Map<string, Task>();

  // ۱. اضافه کردن تسک‌های محلی
  for (const t of local.tasks) {
    taskMap.set(t.id, t);
  }

  // ادغام تسک‌های ورودی
  for (const inTask of incoming.tasks) {
    const locTask = taskMap.get(inTask.id);
    if (!locTask) {
      taskMap.set(inTask.id, inTask);
    } else {
      const locTime = getTaskTime(locTask);
      const inTime = getTaskTime(inTask);

      if (inTime > locTime) {
        taskMap.set(inTask.id, inTask);
      } else if (locTime > inTime) {
        taskMap.set(locTask.id, locTask);
      } else {
        // در صورت برابری زمان
        const deletedAt = inTask.deletedAt || locTask.deletedAt || null;
        taskMap.set(inTask.id, {
          ...inTask,
          description: inTask.description ?? locTask.description,
          tags: Array.from(new Set([...(locTask.tags || []), ...(inTask.tags || [])])),
          deletedAt,
        });
      }
    }
  }

  // پاک‌سازی توم‌استون‌های قدیمی تسک‌ها (بیش از ۳۰ روز)
  const mergedTasks: Task[] = [];
  for (const t of taskMap.values()) {
    if (t.deletedAt) {
      const delTime = new Date(t.deletedAt).getTime();
      if (now - delTime < TOMBSTONE_RETENTION_MS) {
        mergedTasks.push(t);
      }
    } else {
      mergedTasks.push(t);
    }
  }

  // ۲. ادغام یادداشت‌ها
  const noteMap = new Map<string, Note>();
  for (const n of local.notes) {
    noteMap.set(n.id, n);
  }
  for (const inNote of incoming.notes) {
    const locNote = noteMap.get(inNote.id);
    if (!locNote) {
      noteMap.set(inNote.id, inNote);
    } else {
      const locTime = getNoteTime(locNote);
      const inTime = getNoteTime(inNote);
      if (inTime >= locTime) {
        noteMap.set(inNote.id, inNote);
      } else {
        noteMap.set(locNote.id, locNote);
      }
    }
  }

  const mergedNotes: Note[] = [];
  for (const n of noteMap.values()) {
    if (n.deletedAt) {
      const delTime = new Date(n.deletedAt).getTime();
      if (now - delTime < TOMBSTONE_RETENTION_MS) {
        mergedNotes.push(n);
      }
    } else {
      mergedNotes.push(n);
    }
  }

  // ۳. حافظه هوش مصنوعی (بدون چسباندن و تکثیر تکراری رشته‌ها)
  let mergedMemory = (local.aiMemory || "").trim();
  const incomingMemory = (incoming.aiMemory || "").trim();
  if (!mergedMemory && incomingMemory) {
    mergedMemory = incomingMemory;
  } else if (incomingMemory && mergedMemory !== incomingMemory) {
    // در صورت وجود هر دو، نسخه ریموت ورودی ارجحیت دارد (یا نسخه لوکال بر اساس طول و محتوا)
    mergedMemory = incomingMemory;
  }

  return {
    version: 1,
    settings: {
      ...local.settings,
      ...incoming.settings,
    },
    aiMemory: mergedMemory,
    notes: mergedNotes,
    tasks: mergedTasks,
    lastModified: new Date().toISOString(),
  };
}
