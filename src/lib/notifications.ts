import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Task } from "./types.ts";

export const NOTIFICATION_CHANNEL_ID = "taskdrop_urgent_reminders";
export const NOTIFICATION_ACTION_GROUP = "TASK_ALARM_ACTIONS";

/** Converts a string taskId into a deterministic 32-bit positive integer for Android notification IDs */
export function getNotificationIdForTask(taskId: string): number {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    const char = taskId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}

/** Initialize native Android/iOS notification channel and action buttons */
export async function initNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      await LocalNotifications.requestPermissions();
    }

    // Register Notification Action Buttons (Snooze, Done, Dismiss)
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: NOTIFICATION_ACTION_GROUP,
          actions: [
            {
              id: "snooze_15m",
              title: "تعویق ۱۵ دقیقه",
              foreground: true,
            },
            {
              id: "done",
              title: "انجام شد",
              foreground: false,
            },
            {
              id: "dismiss",
              title: "قطع زنگ",
              destructive: true,
              foreground: true,
            },
          ],
        },
      ],
    });

    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: "TaskDrop Reminders",
      description: "Scheduled task alarms with sound, vibration, and lock-screen display",
      importance: 5, // IMPORTANCE_HIGH / MAX
      visibility: 1, // VISIBILITY_PUBLIC (Lockscreen visible)
      sound: "beep.wav",
      vibration: true,
      lights: true,
      lightColor: "#f59e0b",
    });
  } catch (error) {
    console.error("Failed to initialize notification channel:", error);
  }
}

/** Schedule a native alarm notification for a single task */
export async function scheduleTaskNotification(task: Task): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!task.due || task.done || task.deletedAt) {
    await cancelTaskNotification(task.id);
    return;
  }

  const dueTime = new Date(task.due).getTime();
  const now = Date.now();

  if (dueTime <= now) return;

  try {
    const notifId = getNotificationIdForTask(task.id);
    const priorityLabel =
      task.priority === "high" ? "[فوری] " : task.priority === "medium" ? "[مهم] " : "";
    const repeatLabel = task.repeat !== "none" ? ` (${task.repeat})` : "";

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: `${priorityLabel}TaskDrop`,
          body: `${task.title}${repeatLabel}`,
          schedule: {
            at: new Date(dueTime),
            allowWhileIdle: true,
          },
          channelId: NOTIFICATION_CHANNEL_ID,
          actionTypeId: NOTIFICATION_ACTION_GROUP,
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

/** Cancel a native alarm notification for a task */
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

/** Sync all active task deadlines with native system alarms */
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
