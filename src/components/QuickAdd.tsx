import { Input } from "@/components/ui/input.tsx";
import { formatDue, parseInput } from "@/lib/parse.ts";
import { unlockAudio } from "@/lib/notify.ts";
import { getTagStyle } from "@/lib/tags.ts";
import { cn } from "@/lib/utils.ts";
import { CornerDownLeft, Flame } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface Props {
  onAdd: (raw: string) => void;
}

/** تنها ورودی اپ: یک خط، بدون فرم، بدون دیالوگ. Enter یعنی ثبت. */
export function QuickAdd({ onAdd }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (value.trim() ? parseInput(value) : null), [value]);

  return (
    <div className="relative">
      <Input
        ref={ref}
        id="quick-add-input"
        autoFocus
        value={value}
        placeholder="چی یادت نره؟  مثلاً: فردا ساعت ۱۰ جلسه فنی !فوری #کار"
        onChange={(e) => setValue(e.target.value)}
        onFocus={unlockAudio}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value);
            setValue("");
          }
          if (e.key === "Escape") {
            setValue("");
            ref.current?.blur();
          }
        }}
        className="h-14 rounded-xl border-zinc-700/80 bg-zinc-900/90 pe-14 ps-4 text-base font-normal shadow-sm placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300"
      />
      <div className="pointer-events-none absolute end-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <kbd className="hidden rounded border border-zinc-700 bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 sm:inline-block">
          /
        </kbd>
        <CornerDownLeft className="size-4 text-zinc-400" />
      </div>
      {preview && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 px-1 text-xs">
          <span className="font-semibold text-zinc-100">{preview.title || "…"}</span>
          {preview.priority === "high" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-red-800/80 bg-red-950/80 px-2 py-0.5 text-[11px] font-semibold text-red-300">
              <Flame className="size-3 text-red-400" />
              فوری
            </span>
          )}
          {preview.priority === "medium" && (
            <span className="inline-flex items-center rounded-md border border-amber-800/80 bg-amber-950/80 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              اولویت متوسط
            </span>
          )}
          {preview.due && (
            <span className="rounded-md bg-white px-2.5 py-0.5 font-semibold text-black shadow-xs">
              {formatDue(preview.due.toISOString())}
            </span>
          )}
          {preview.repeat !== "none" && (
            <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-zinc-300">
              {{ daily: "هر روز", weekly: "هر هفته", monthly: "هر ماه" }[preview.repeat]}
            </span>
          )}
          {preview.tags.map((t) => {
            const style = getTagStyle(t);
            return (
              <span
                key={t}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                  style.bg,
                  style.text,
                  style.border,
                )}
              >
                <span className={cn("size-1.5 rounded-full", style.dot)} />#{t}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
