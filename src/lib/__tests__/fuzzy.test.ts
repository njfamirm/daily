import { describe, expect, it } from "vite-plus/test";
import { fuzzySearchTasks, normalizeText } from "../fuzzy.ts";
import type { Task } from "../types.ts";

describe("fuzzy search", () => {
  it("normalizes Persian and Arabic letters properly", () => {
    expect(normalizeText("پروژۀ جديد")).toBe("پروژه جدید");
    expect(normalizeText("كتابخانة")).toBe("کتابخانه");
    expect(normalizeText("تسک   تست")).toBe("تسک تست");
    expect(normalizeText("شماره ۱۲۳")).toBe("شماره 123");
  });

  const mockTasks: Task[] = [
    {
      id: "1",
      title: "خرید میوه و نان",
      description: "از سوپرمارکت محله",
      due: null,
      repeat: "none",
      priority: "medium",
      done: false,
      createdAt: "2026-01-01T00:00:00Z",
      doneAt: null,
      notifiedAt: null,
      tags: ["خرید", "خانه"],
    },
    {
      id: "2",
      title: "جلسه فنی با تیم بک‌اند",
      description: "بررسی API های جدید",
      due: null,
      repeat: "weekly",
      priority: "high",
      done: false,
      createdAt: "2026-01-02T00:00:00Z",
      doneAt: null,
      notifiedAt: null,
      tags: ["کار", "جلسه"],
    },
    {
      id: "3",
      title: "Design new UI component",
      description: "Refactor task list with fuzzy search",
      due: null,
      repeat: "none",
      priority: "low",
      done: false,
      createdAt: "2026-01-03T00:00:00Z",
      doneAt: null,
      notifiedAt: null,
      tags: ["work", "ui"],
    },
  ];

  it("finds exact and substring matches in title", () => {
    const results = fuzzySearchTasks(mockTasks, "خرید");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("finds matches with Persian character variations (ي vs ی)", () => {
    const results = fuzzySearchTasks(mockTasks, "خريد");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("finds matches in description", () => {
    const results = fuzzySearchTasks(mockTasks, "سوپرمارکت");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("finds matches by tags", () => {
    const results = fuzzySearchTasks(mockTasks, "جلسه");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("matches english sequential fuzzy characters", () => {
    const results = fuzzySearchTasks(mockTasks, "dsgn");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("3");
  });

  it("returns all tasks when query is empty", () => {
    const results = fuzzySearchTasks(mockTasks, "");
    expect(results).toHaveLength(3);
  });
});
