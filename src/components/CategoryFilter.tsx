import { getTranslation } from "@/lib/i18n.ts";
import { extractFacetGroups, getTagStyle, parseTag } from "@/lib/tags.ts";
import type { Language, Task } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";
import { Inbox, Layers, Tag } from "lucide-react";
import { useMemo } from "react";

interface Props {
  activeCategory: string | null;
  tasks: Task[];
  lang?: Language;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({ activeCategory, tasks, lang = "fa", onSelectCategory }: Props) {
  const t = getTranslation(lang);

  const { openTasks, facetGroups, uncategorizedCount } = useMemo(() => {
    const open = tasks.filter((task) => !task.done && !task.deletedAt);
    const groups = extractFacetGroups(tasks);
    const uncategorized = open.filter((task) => !task.tags || task.tags.length === 0).length;

    return {
      openTasks: open,
      facetGroups: groups,
      uncategorizedCount: uncategorized,
    };
  }, [tasks]);

  // Primary Scoped Facet (e.g., "حوزه" / "area")
  const primaryFacetGroup = useMemo(() => {
    return (
      facetGroups.find(
        (g) => g.isScoped && (g.key.toLowerCase() === "حوزه" || g.key.toLowerCase() === "area"),
      ) || facetGroups.find((g) => g.isScoped)
    );
  }, [facetGroups]);

  // Secondary Facets & Standalone Tags
  const secondaryFacetGroups = useMemo(() => {
    return facetGroups.filter((g) => g !== primaryFacetGroup);
  }, [facetGroups, primaryFacetGroup]);

  if (facetGroups.length === 0 && uncategorizedCount === 0) {
    return null;
  }

  return (
    <div className="space-y-2 py-1">
      {/* Primary Scope Switcher (e.g. حوزه: نکسیم | شخصی | NGO) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
        {/* "All" Category Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            activeCategory === null
              ? "border-amber-500/80 bg-amber-500/20 text-amber-300 shadow-xs"
              : "border-zinc-800/90 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200",
          )}
        >
          <Layers className="size-3.5" />
          <span>{t.categoryAll}</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.2 text-[10px] font-mono",
              activeCategory === null
                ? "bg-amber-950/80 text-amber-200"
                : "bg-zinc-800/80 text-zinc-400",
            )}
          >
            {openTasks.length}
          </span>
        </button>

        {/* Primary Facet Values (e.g. نکسیم, شخصی, NGO) */}
        {primaryFacetGroup?.values.map((item) => {
          const isActive = activeCategory === item.rawTag || activeCategory === item.value;
          const style = getTagStyle(item.rawTag);

          return (
            <button
              key={item.rawTag}
              type="button"
              onClick={() => onSelectCategory(isActive ? null : item.rawTag)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                isActive
                  ? cn("shadow-xs text-white", style.bg, style.border)
                  : "border-zinc-800/90 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200",
              )}
            >
              <span className={cn("size-2 rounded-full shrink-0", style.dot)} />
              <span className="text-[11px] opacity-70 font-normal">{primaryFacetGroup.key}:</span>
              <span>{item.value}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.2 text-[10px] font-mono",
                  isActive ? "bg-black/30 text-zinc-100" : "bg-zinc-800/80 text-zinc-400",
                )}
              >
                {item.openCount}
              </span>
            </button>
          );
        })}

        {/* Uncategorized Pill */}
        {uncategorizedCount > 0 && (
          <button
            type="button"
            onClick={() =>
              onSelectCategory(activeCategory === "uncategorized" ? null : "uncategorized")
            }
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              activeCategory === "uncategorized"
                ? "border-zinc-500 bg-zinc-800 text-white shadow-xs"
                : "border-zinc-800/90 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200",
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

      {/* Secondary Facets & Tags Row (e.g. نوع: روتین / جلسه, یا پروژه‌ها) */}
      {secondaryFacetGroups.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5 no-scrollbar">
          {secondaryFacetGroups.map((group) =>
            group.values.map((item) => {
              const isActive = activeCategory === item.rawTag || activeCategory === item.value;
              const style = getTagStyle(item.rawTag);
              const parsed = parseTag(item.rawTag);

              return (
                <button
                  key={item.rawTag}
                  type="button"
                  onClick={() => onSelectCategory(isActive ? null : item.rawTag)}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer",
                    isActive
                      ? cn("shadow-xs text-white", style.bg, style.border)
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
                  )}
                >
                  {parsed.isScoped ? (
                    <>
                      <span className="text-[10px] opacity-60 font-mono">{parsed.key}:</span>
                      <span>{parsed.value}</span>
                    </>
                  ) : (
                    <>
                      <Tag className="size-2.5 text-zinc-500" />
                      <span>#{item.value}</span>
                    </>
                  )}
                  <span className="text-[10px] opacity-60 font-mono ms-0.5">
                    ({item.openCount})
                  </span>
                </button>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
