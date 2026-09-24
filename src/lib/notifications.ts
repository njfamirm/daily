import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Task } from "./types.ts";

export const NOTIFICATION_CHANNEL_ID = "taskdrop_urgent_reminders";

/**
 * تبدیل ID رشته‌ای تسک به عدد صحیح یکتا و معتبر برای سیستم نوتیفیکیشن اندروید
 */
export function getNotificationIdForTask(taskId: string): number {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    const char = taskId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}

/**
 * آماده‌سازی کانال نوتیفیکیشن اختصاصی با بیشترین اولویت، صدا و نمایش کامل در صفحه قفل
 */
export async function initNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: "یادآورهای فوری تسک‌دراپ",
      description: "اعلان‌های زمان‌دار تسک‌ها همراه با پخش صدا، لرزش و نمایش در صفحه قفل",
      importance: 5, // IMPORTANCE_HIGH / MAX
      visibility: 1, // VISIBILITY_PUBLIC (نمایش در لاک‌اسکرین)
      sound: "beep.wav",
      vibration: true,
      lights: true,
      lightColor: "#f59e0b",
    });
  } catch (error) {
    console.error("Failed to initialize notification channel:", error);
  }
}

/**
 * زمان‌بندی یادآور بومی برای یک تسک
 */
export async function scheduleTaskNotification(task: Task): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!task.due || task.done || task.deletedAt) {
    await cancelTaskNotification(task.id);
    return;
  }

  const dueTime = new Date(task.due).getTime();
  const now = Date.now();

  // اگر زمان موعد گذشته باشد نیازی به تنظیم آلارم نیست
  if (dueTime <= now) return;

  try {
    const notifId = getNotificationIdForTask(task.id);
    const priorityLabel =
      task.priority === "high" ? "🚨 فوری | " : task.priority === "medium" ? "⚡ مهم | " : "";
    const repeatLabel = task.repeat !== "none" ? ` (تکرار: ${task.repeat})` : "";

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: `${priorityLabel}تسک‌دراپ: موعد انجام کار`,
          body: `${task.title}${repeatLabel}`,
          schedule: {
            at: new Date(dueTime),
            allowWhileIdle: true, // حتی در زمان Doze mode / قفل بودن صفحه
          },
          channelId: NOTIFICATION_CHANNEL_ID,
          sound: "beep.wav",
          smallIcon: "ic_stat_icon_config_sample",
          iconColor: "#f59e0b",
          extra: {
            taskId: task.id,
          },
        },
      ],
    });
  } catch (error) {
    console.error(`Failed to schedule notification for task ${task.id}:`, error);
  }
}

/**
 * لغو نوتیفیکیشن یک تسک (مثلاً هنگام انجام شدن یا حذف)
 */
export async function cancelTaskNotification(taskId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const notifId = getNotificationIdForTask(taskId);
    await LocalNotifications.cancel({
      notifications: [{ id: notifId }],
    });
  } catch (error) {
    console.error(`Failed to cancel notification for task ${taskId}:`, error);
  }
}

/**
 * همگام‌سازی کامل تمام تسک‌های فعال با سیستم نوتیفیکیشن دستگاه
 */
export async function syncAllTaskNotifications(tasks: Task[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  for (const task of tasks) {
    if (!task.done && !task.deletedAt && task.due) {
      await scheduleTaskNotification(task);
    } else {
      await cancelTaskNotification(task.id);
    }
  }
}
