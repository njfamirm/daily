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
        autoFocus
        value={value}
        placeholder="چی یادت نره؟  مثلاً: دوشنبه هفته بعد ساعت ۱۰ کوک کنم"
        onChange={(e) => setValue(e.target.value)}
        onFocus={unlockAudio}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value);
            setValue("");
          }
          if (e.key === "Escape") setValue("");
        }}
        className="h-14 rounded-xl border-neutral-800 bg-neutral-900/60 pe-12 ps-4 text-base"
      />
      <CornerDownLeft className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-neutral-600" />
      {preview && (
        <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-xs text-neutral-500">
          <span className="text-neutral-300">{preview.title || "…"}</span>
          {preview.due && (
            <span className="rounded-md bg-white px-2 py-0.5 font-medium text-black">
              {formatDue(preview.due.toISOString())}
            </span>
          )}
          {preview.repeat !== "none" && (
            <span className="rounded-md border border-neutral-700 px-2 py-0.5">
              {{ daily: "هر روز", weekly: "هر هفته", monthly: "هر ماه" }[preview.repeat]}
            </span>
          )}
          {preview.tags.map((t) => (
            <span key={t} className="rounded-md border border-neutral-700 px-2 py-0.5">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
