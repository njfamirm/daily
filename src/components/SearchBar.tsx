import { Kbd } from "@/components/ui/kbd.tsx";
import { getTranslation } from "@/lib/i18n.ts";
import type { Language } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  query: string;
  onChange: (query: string) => void;
  onClose?: () => void;
  lang?: Language;
  resultsCount?: number;
}

export function SearchBar({ query, onChange, onClose, lang = "fa", resultsCount }: Props) {
  const t = getTranslation(lang);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Global shortcut to focus search input: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (!query && onClose) {
          onClose();
        } else {
          onChange("");
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query, onChange, onClose]);

  return (
    <div className="relative flex items-center animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="pointer-events-none absolute start-3.5 flex items-center text-zinc-400">
        <Search className="size-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={t.searchPlaceholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (!query && onClose) {
              onClose();
            } else {
              onChange("");
              inputRef.current?.blur();
            }
          }
        }}
        className={cn(
          "h-11 w-full rounded-xl border border-zinc-800/90 bg-zinc-900/60 pe-16 ps-10 text-sm font-medium text-zinc-100 placeholder:text-zinc-500 shadow-inner transition-all",
          "focus:border-zinc-500 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400",
          query.trim() && "border-zinc-600 bg-zinc-900",
        )}
      />

      <div className="absolute end-2.5 flex items-center gap-1.5">
        {query ? (
          <>
            {resultsCount !== undefined && (
              <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono text-zinc-300">
                {resultsCount}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              title={t.clearSearch}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <>
            <Kbd size="xs" className="hidden sm:inline-flex text-zinc-400">
              Esc
            </Kbd>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title={lang === "fa" ? "بستن جستجو" : "Close search"}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
