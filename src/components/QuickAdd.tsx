import { Input } from "@/components/ui/input.tsx";
import { formatDue, parseInput } from "@/lib/parse.ts";
import { unlockAudio } from "@/lib/notify.ts";
import { CornerDownLeft } from "lucide-react";
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
        placeholder="چی یادت نره؟  مثلاً: فردا ساعت ۱۰ پیگیری پروژه #کار"
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
          <span className="font-medium text-zinc-200">{preview.title || "…"}</span>
          {preview.due && (
            <span className="rounded-md bg-white px-2.5 py-0.5 font-medium text-black shadow-xs">
              {formatDue(preview.due.toISOString())}
            </span>
          )}
          {preview.repeat !== "none" && (
            <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-zinc-300">
              {{ daily: "هر روز", weekly: "هر هفته", monthly: "هر ماه" }[preview.repeat]}
            </span>
          )}
          {preview.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-zinc-300"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
