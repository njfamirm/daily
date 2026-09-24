import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import type { Note } from "@/lib/types.ts";
import { Pin, Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  notes: Note[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
}

/** نکته‌های ثابت — چیزهایی که باید همیشه جلوی چشم باشند، نه تسک. */
export function Notes({ notes, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    if (value.trim()) onAdd(value.trim());
    setValue("");
    setAdding(false);
  };

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400">
          <Pin className="size-3.5" />
          جلوی چشم
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="افزودن نکته"
          onClick={() => setAdding(true)}
        >
          <Plus />
        </Button>
      </div>

      {notes.length === 0 && !adding && (
        <p className="px-1 pb-1 text-xs text-neutral-600">
          چیزهایی که همیشه باید یادت باشه؛ مثلاً «گسترش بده به تلگرام».
        </p>
      )}

      <ul className="space-y-1">
        {notes.map((n) => (
          <li
            key={n.id}
            className="group flex items-start gap-2 rounded-lg px-1 py-1 text-sm text-neutral-200 hover:bg-neutral-900"
          >
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-neutral-500" />
            <span className="flex-1 whitespace-pre-wrap break-words">{n.text}</span>
            <button
              type="button"
              aria-label="حذف نکته"
              onClick={() => onRemove(n.id)}
              className="mt-0.5 text-neutral-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {adding && (
        <Input
          autoFocus
          value={value}
          placeholder="نکته…"
          className="mt-2 h-9"
          onChange={(e) => setValue(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setValue("");
              setAdding(false);
            }
          }}
        />
      )}
    </section>
  );
}
