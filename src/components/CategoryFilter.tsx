import { getTranslation } from "@/lib/i18n.ts";
import { getTagStyle } from "@/lib/tags.ts";
import type { Language, Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { Inbox, Layers } from "lucide-react";
import { useMemo } from "react";

interface Props {
  activeCategory: string | null;
  tasks: Task[];
  lang?: Language;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({ activeCategory, tasks, lang = "fa", onSelectCategory }: Props) {
  const t = getTranslation(lang);

  const { openTasks, categoryStats, uncategorizedCount } = useMemo(() => {
    const open = tasks.filter((task) => !task.done && !task.deletedAt);
    const stats: Record<string, number> = {};
    let uncategorized = 0;

    for (const task of open) {
      if (!task.tags || task.tags.length === 0) {
        uncategorized++;
      } else {
        for (const rawTag of task.tags) {
          const tag = rawTag.trim();
          if (tag) {
            stats[tag] = (stats[tag] || 0) + 1;
          }
        }
      }
    }

    return {
      openTasks: open,
      categoryStats: stats,
      uncategorizedCount: uncategorized,
    };
  }, [tasks]);

  const uniqueTags = useMemo(() => {
    return Object.keys(categoryStats).sort((a, b) => {
      // Sort by frequency
      return categoryStats[b] - categoryStats[a];
    });
  }, [categoryStats]);

  if (uniqueTags.length === 0 && uncategorizedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth">
      {/* "All" Category Pill */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
          activeCategory === null
            ? "border-zinc-500 bg-zinc-800 text-white shadow-xs"
            : "border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200",
        )}
      >
        <Layers className="size-3.5 text-zinc-400" />
        <span>{t.categoryAll}</span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.2 text-[10px] font-mono",
            activeCategory === null ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800/80 text-zinc-400",
          )}
        >
          {openTasks.length}
        </span>
      </button>

      {/* Individual Category / Tag Pills */}
      {uniqueTags.map((tag) => {
        const count = categoryStats[tag] || 0;
        const isActive = activeCategory === tag;
        const style = getTagStyle(tag);

        return (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectCategory(isActive ? null : tag)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              isActive
                ? cn("shadow-xs text-white", style.bg, style.border)
                : "border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200",
            )}
          >
            <span className={cn("size-2 rounded-full shrink-0", style.dot)} />
            <span>#{tag}</span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.2 text-[10px] font-mono",
                isActive ? "bg-black/30 text-zinc-100" : "bg-zinc-800/80 text-zinc-400",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* "Uncategorized" Pill */}
      {uncategorizedCount > 0 && uniqueTags.length > 0 && (
        <button
          type="button"
          onClick={() =>
            onSelectCategory(activeCategory === "uncategorized" ? null : "uncategorized")
          }
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            activeCategory === "uncategorized"
              ? "border-zinc-500 bg-zinc-800 text-white shadow-xs"
              : "border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200",
          )}
        >
          <Inbox className="size-3.5 text-zinc-400" />
          <span>{t.categoryUncategorized}</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.2 text-[10px] font-mono",
              activeCategory === "uncategorized"
                ? "bg-zinc-700 text-zinc-200"
                : "bg-zinc-800/80 text-zinc-400",
            )}
          >
            {uncategorizedCount}
          </span>
        </button>
      )}
    </div>
  );
}
