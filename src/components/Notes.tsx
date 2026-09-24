import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import type { Language, Note } from "@/lib/types.ts";
import { Pin, Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  notes: Note[];
  lang?: Language;
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
}

/** Pinned focus notes — items that should stay in sight at all times */
export function Notes({ notes, lang = "fa", onAdd, onRemove }: Props) {
  const t = getTranslation(lang);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    if (value.trim()) onAdd(value.trim());
    setValue("");
    setAdding(false);
  };

  if (notes.length === 0 && !adding) {
    return null;
  }

  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-3.5 shadow-xs">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Pin className="size-3.5 text-amber-400" />
          {t.keepInSight}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t.addNote}
          title={t.addNote}
          onClick={() => setAdding(true)}
        >
          <Plus />
        </Button>
      </div>

      <ul className="space-y-1.5">
        {notes.map((n) => (
          <li
            key={n.id}
            className="group flex items-start gap-2.5 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-2.5 py-1.5 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400/80" />
            <span className="flex-1 whitespace-pre-wrap break-words">{n.text}</span>
            <button
              type="button"
              aria-label={t.deleteNoteAria}
              onClick={() => onRemove(n.id)}
              className="mt-0.5 text-zinc-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100 cursor-pointer"
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
          placeholder={t.notePlaceholder}
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
