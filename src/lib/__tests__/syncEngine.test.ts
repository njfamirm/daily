import { mergeDBs } from "@/lib/syncEngine.ts";
import { DEFAULT_DB, type DB, type Task } from "@/lib/types.ts";
import { describe, expect, it } from "vite-plus/test";

describe("syncEngine - mergeDBs", () => {
  it("should not resurrect deleted tasks (Tombstones)", () => {
    const t1: Task = {
      id: "task-1",
      title: "تسک اول",
      due: null,
      repeat: "none",
      priority: "none",
      done: false,
      createdAt: "2026-09-24T10:00:00.000Z",
      updatedAt: "2026-09-24T10:00:00.000Z",
      doneAt: null,
      deletedAt: null,
      notifiedAt: null,
      tags: [],
    };

    const localDb: DB = {
      ...DEFAULT_DB,
      tasks: [
        {
          ...t1,
          deletedAt: "2026-09-24T10:05:00.000Z",
          updatedAt: "2026-09-24T10:05:00.000Z",
        },
      ],
    };

    const incomingDb: DB = {
      ...DEFAULT_DB,
      tasks: [t1], // دستگاه ریموت هنوز تسک را پاک نکرده و تسک فعال دارد ولی تایم قدیمی‌تر است
    };

    const merged = mergeDBs(localDb, incomingDb);
    expect(merged.tasks.length).toBe(1);
    expect(merged.tasks[0].deletedAt).toBe("2026-09-24T10:05:00.000Z");
  });

  it("should pick the newest edit for a task (LWW)", () => {
    const localDb: DB = {
      ...DEFAULT_DB,
      tasks: [
        {
          id: "task-1",
          title: "عنوان قدیمی",
          due: null,
          repeat: "none",
          priority: "none",
          done: false,
          createdAt: "2026-09-24T10:00:00.000Z",
          updatedAt: "2026-09-24T10:01:00.000Z",
          doneAt: null,
          deletedAt: null,
          notifiedAt: null,
          tags: ["کار"],
        },
      ],
    };

    const incomingDb: DB = {
      ...DEFAULT_DB,
      tasks: [
        {
          id: "task-1",
          title: "عنوان جدید و ادیت‌شده",
          due: null,
          repeat: "none",
          priority: "high",
          done: false,
          createdAt: "2026-09-24T10:00:00.000Z",
          updatedAt: "2026-09-24T10:02:00.000Z",
          doneAt: null,
          deletedAt: null,
          notifiedAt: null,
          tags: ["فوری"],
        },
      ],
    };

    const merged = mergeDBs(localDb, incomingDb);
    expect(merged.tasks.length).toBe(1);
    expect(merged.tasks[0].title).toBe("عنوان جدید و ادیت‌شده");
    expect(merged.tasks[0].priority).toBe("high");
  });

  it("should not duplicate aiMemory on merge", () => {
    const localDb: DB = {
      ...DEFAULT_DB,
      aiMemory: "دستورالعمل ۱",
    };

    const incomingDb: DB = {
      ...DEFAULT_DB,
      aiMemory: "دستورالعمل ۱",
    };

    const merged = mergeDBs(localDb, incomingDb);
    expect(merged.aiMemory).toBe("دستورالعمل ۱");
  });
});
