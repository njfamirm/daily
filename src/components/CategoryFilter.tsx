import { Badge } from "@/components/ui/badge.tsx";
import { parseTag } from "@/lib/tags.ts";
import type { Language, Task } from "@/lib/types.ts";
import { X } from "lucide-react";

interface Props {
  activeCategory: string | null;
  tasks: Task[];
  lang?: Language;
  onSelectCategory: (category: string | null) => void;
}

/**
 * Minimalist Active Filter Chip Bar.
 * Stays completely hidden by default to preserve extreme minimalism,
 * and only appears when a category/tag filter is actively selected by the user.
 */
export function CategoryFilter({ activeCategory, lang = "fa", onSelectCategory }: Props) {
  const isFa = lang === "fa";

  if (!activeCategory) {
    return null;
  }

  const parsed = parseTag(activeCategory);

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-3 py-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 text-xs font-medium">
          {isFa ? "فیلتر فعال:" : "Active Filter:"}
        </span>
        <Badge variant="warning" className="gap-1.5 font-semibold">
          {parsed.isScoped ? (
            <span>
              <span className="opacity-60 font-normal">#{parsed.key}:</span>
              <span>{parsed.value}</span>
            </span>
          ) : (
            <span>#{activeCategory}</span>
          )}
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            title={isFa ? "حذف فیلتر" : "Clear filter"}
            className="rounded p-0.5 text-amber-300/80 hover:bg-amber-500/20 hover:text-amber-100 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      </div>

      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className="text-[11px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2 cursor-pointer transition-colors"
      >
        {isFa ? "نمایش همه تسک‌ها" : "Show all tasks"}
      </button>
    </div>
  );
}
