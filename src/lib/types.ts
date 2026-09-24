export type Repeat = "none" | "daily" | "weekly" | "monthly";
export type Priority = "none" | "low" | "medium" | "high";

export interface Task {
  /** شناسه یکتا */
  id: string;
  /** متن تعهد */
  title: string;
  /** زمان یادآوری، ISO 8601 با تایم‌زون محلی؛ null یعنی بدون زمان */
  due: string | null;
  /** تکرار خودکار بعد از انجام‌شدن/سررسید */
  repeat: Repeat;
  /** درجه اولویت */
  priority: Priority;
  done: boolean;
  createdAt: string;
  doneAt: string | null;
  /** آخرین باری که نوتیف داده شده (برای جلوگیری از تکرار نوتیف) */
  notifiedAt: string | null;
  tags: string[];
}

/** یادداشت ثابت که همیشه بالای صفحه دیده می‌شود */
export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface Settings {
  /** پخش صدا هنگام سررسید */
  sound: boolean;
  /** نوتیفیکیشن مرورگر */
  notifications: boolean;
  /** فاصله بررسی سررسیدها بر حسب ثانیه */
  checkIntervalSec: number;
  /** چند دقیقه قبل از موعد هم یادآوری شود */
  leadMinutes: number;
}

export interface DB {
  version: 1;
  settings: Settings;
  /** حافظه و دستورالعمل‌های پایدار برای هوش مصنوعی */
  aiMemory?: string;
  notes: Note[];
  tasks: Task[];
}

export const DEFAULT_DB: DB = {
  version: 1,
  settings: {
    sound: true,
    notifications: true,
    checkIntervalSec: 15,
    leadMinutes: 0,
  },
  aiMemory: "",
  notes: [],
  tasks: [],
};
