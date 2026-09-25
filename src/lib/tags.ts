import type { Priority, Task } from "@/lib/types.ts";

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  keyBg?: string;
}

export interface ParsedTag {
  raw: string;
  isScoped: boolean;
  key?: string;
  value: string;
}

/**
 * Parses a raw tag into either a scoped facet (e.g. "حوزه:نکسیم" -> key: "حوزه", value: "نکسیم")
 * or a simple standalone tag.
 */
export function parseTag(tag: string): ParsedTag {
  const clean = tag.trim().replace(/^#/, "");
  const colonIdx = clean.indexOf(":");
  if (colonIdx > 0 && colonIdx < clean.length - 1) {
    const key = clean.slice(0, colonIdx).trim();
    const value = clean.slice(colonIdx + 1).trim();
    return {
      raw: clean,
      isScoped: true,
      key,
      value,
    };
  }
  return {
    raw: clean,
    isScoped: false,
    value: clean,
  };
}

const PRESET_KEY_STYLES: Record<
  string,
  { bg: string; text: string; border: string; keyBg: string; dot: string }
> = {
  حوزه: {
    bg: "bg-amber-950/40",
    text: "text-amber-200",
    border: "border-amber-700/60",
    keyBg: "bg-amber-900/60 text-amber-300",
    dot: "bg-amber-400",
  },
  area: {
    bg: "bg-amber-950/40",
    text: "text-amber-200",
    border: "border-amber-700/60",
    keyBg: "bg-amber-900/60 text-amber-300",
    dot: "bg-amber-400",
  },
  نوع: {
    bg: "bg-sky-950/40",
    text: "text-sky-200",
    border: "border-sky-700/60",
    keyBg: "bg-sky-900/60 text-sky-300",
    dot: "bg-sky-400",
  },
  type: {
    bg: "bg-sky-950/40",
    text: "text-sky-200",
    border: "border-sky-700/60",
    keyBg: "bg-sky-900/60 text-sky-300",
    dot: "bg-sky-400",
  },
  پروژه: {
    bg: "bg-violet-950/40",
    text: "text-violet-200",
    border: "border-violet-700/60",
    keyBg: "bg-violet-900/60 text-violet-300",
    dot: "bg-violet-400",
  },
  project: {
    bg: "bg-violet-950/40",
    text: "text-violet-200",
    border: "border-violet-700/60",
    keyBg: "bg-violet-900/60 text-violet-300",
    dot: "bg-violet-400",
  },
  مشتری: {
    bg: "bg-emerald-950/40",
    text: "text-emerald-200",
    border: "border-emerald-700/60",
    keyBg: "bg-emerald-900/60 text-emerald-300",
    dot: "bg-emerald-400",
  },
  client: {
    bg: "bg-emerald-950/40",
    text: "text-emerald-200",
    border: "border-emerald-700/60",
    keyBg: "bg-emerald-900/60 text-emerald-300",
    dot: "bg-emerald-400",
  },
};

const DYNAMIC_PALETTES: TagStyle[] = [
  {
    bg: "bg-violet-950/60",
    text: "text-violet-300",
    border: "border-violet-800/70",
    dot: "bg-violet-400",
    keyBg: "bg-violet-900/60 text-violet-200",
  },
  {
    bg: "bg-cyan-950/60",
    text: "text-cyan-300",
    border: "border-cyan-800/70",
    dot: "bg-cyan-400",
    keyBg: "bg-cyan-900/60 text-cyan-200",
  },
  {
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/70",
    dot: "bg-emerald-400",
    keyBg: "bg-emerald-900/60 text-emerald-200",
  },
  {
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/70",
    dot: "bg-amber-400",
    keyBg: "bg-amber-900/60 text-amber-200",
  },
  {
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-800/70",
    dot: "bg-rose-400",
    keyBg: "bg-rose-900/60 text-rose-200",
  },
  {
    bg: "bg-blue-950/60",
    text: "text-blue-300",
    border: "border-blue-800/70",
    dot: "bg-blue-400",
    keyBg: "bg-blue-900/60 text-blue-200",
  },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTagStyle(tag: string): TagStyle {
  const parsed = parseTag(tag);
  if (parsed.isScoped && parsed.key && PRESET_KEY_STYLES[parsed.key.toLowerCase()]) {
    return PRESET_KEY_STYLES[parsed.key.toLowerCase()];
  }
  const cleanTag = parsed.raw.toLowerCase();
  const index = hashString(cleanTag) % DYNAMIC_PALETTES.length;
  return DYNAMIC_PALETTES[index];
}

export interface FacetGroup {
  key: string;
  isScoped: boolean;
  values: {
    value: string;
    rawTag: string;
    count: number;
    openCount: number;
  }[];
}

/**
 * Extracts and aggregates all facet keys and values across active tasks.
 * (e.g. Scoped facets like "حوزه: [نکسیم, شخصی, ngo]", "نوع: [روتین, جلسه]", and standalone tags)
 */
export function extractFacetGroups(tasks: Task[]): FacetGroup[] {
  const facetMap = new Map<
    string,
    {
      isScoped: boolean;
      valueMap: Map<string, { rawTag: string; count: number; openCount: number }>;
    }
  >();

  for (const task of tasks) {
    if (task.deletedAt) continue;
    if (!task.tags || task.tags.length === 0) continue;

    for (const tag of task.tags) {
      const parsed = parseTag(tag);
      const groupKey = parsed.isScoped ? parsed.key || "سایر" : "برچسب‌ها";
      const val = parsed.value;

      if (!facetMap.has(groupKey)) {
        facetMap.set(groupKey, {
          isScoped: parsed.isScoped,
          valueMap: new Map(),
        });
      }

      const group = facetMap.get(groupKey)!;
      if (!group.valueMap.has(val)) {
        group.valueMap.set(val, {
          rawTag: parsed.raw,
          count: 0,
          openCount: 0,
        });
      }

      const stats = group.valueMap.get(val)!;
      stats.count++;
      if (!task.done) {
        stats.openCount++;
      }
    }
  }

  const result: FacetGroup[] = [];

  // Give priority to "حوزه" / "area" as primary category facet
  const primaryKeys = ["حوزه", "area", "نوع", "type", "پروژه", "project"];
  const sortedKeys = Array.from(facetMap.keys()).sort((a, b) => {
    const idxA = primaryKeys.indexOf(a.toLowerCase());
    const idxB = primaryKeys.indexOf(b.toLowerCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const key of sortedKeys) {
    const data = facetMap.get(key)!;
    const values = Array.from(data.valueMap.entries()).map(([value, info]) => ({
      value,
      rawTag: info.rawTag,
      count: info.count,
      openCount: info.openCount,
    }));
    result.push({
      key,
      isScoped: data.isScoped,
      values,
    });
  }

  return result;
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; border: string; badgeBg: string; badgeText: string; iconColor: string }
> = {
  high: {
    label: "High Priority",
    border: "border-s-4 border-s-red-500",
    badgeBg: "bg-red-950/80 border-red-800/70",
    badgeText: "text-red-300",
    iconColor: "text-red-400",
  },
  medium: {
    label: "Medium Priority",
    border: "border-s-4 border-s-amber-500",
    badgeBg: "bg-amber-950/80 border-amber-800/70",
    badgeText: "text-amber-300",
    iconColor: "text-amber-400",
  },
  low: {
    label: "Low Priority",
    border: "border-s-4 border-s-blue-500/60",
    badgeBg: "bg-blue-950/80 border-blue-800/70",
    badgeText: "text-blue-300",
    iconColor: "text-blue-400",
  },
  none: {
    label: "",
    border: "border-s-4 border-s-transparent",
    badgeBg: "",
    badgeText: "",
    iconColor: "",
  },
};
