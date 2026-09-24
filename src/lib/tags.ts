import type { Priority } from "@/lib/types.ts";

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const PRESET_TAG_STYLES: Record<string, TagStyle> = {
  مهم: {
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-800/70",
    dot: "bg-rose-400",
  },
  فوری: {
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-800/70",
    dot: "bg-rose-400",
  },
  ضروری: {
    bg: "bg-red-950/60",
    text: "text-red-300",
    border: "border-red-800/70",
    dot: "bg-red-400",
  },
  urgent: {
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-800/70",
    dot: "bg-rose-400",
  },
  کار: {
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-800/70",
    dot: "bg-sky-400",
  },
  پروژه: {
    bg: "bg-blue-950/60",
    text: "text-blue-300",
    border: "border-blue-800/70",
    dot: "bg-blue-400",
  },
  شخصی: {
    bg: "bg-purple-950/60",
    text: "text-purple-300",
    border: "border-purple-800/70",
    dot: "bg-purple-400",
  },
  خرید: {
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/70",
    dot: "bg-emerald-400",
  },
  مالی: {
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/70",
    dot: "bg-emerald-400",
  },
  ایده: {
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/70",
    dot: "bg-amber-400",
  },
  مطالعه: {
    bg: "bg-teal-950/60",
    text: "text-teal-300",
    border: "border-teal-800/70",
    dot: "bg-teal-400",
  },
  یادگیری: {
    bg: "bg-cyan-950/60",
    text: "text-cyan-300",
    border: "border-cyan-800/70",
    dot: "bg-cyan-400",
  },
  جلسه: {
    bg: "bg-indigo-950/60",
    text: "text-indigo-300",
    border: "border-indigo-800/70",
    dot: "bg-indigo-400",
  },
  سلامتی: {
    bg: "bg-green-950/60",
    text: "text-green-300",
    border: "border-green-800/70",
    dot: "bg-green-400",
  },
  ورزش: {
    bg: "bg-orange-950/60",
    text: "text-orange-300",
    border: "border-orange-800/70",
    dot: "bg-orange-400",
  },
};

const DYNAMIC_PALETTES: TagStyle[] = [
  {
    bg: "bg-violet-950/60",
    text: "text-violet-300",
    border: "border-violet-800/70",
    dot: "bg-violet-400",
  },
  {
    bg: "bg-cyan-950/60",
    text: "text-cyan-300",
    border: "border-cyan-800/70",
    dot: "bg-cyan-400",
  },
  {
    bg: "bg-fuchsia-950/60",
    text: "text-fuchsia-300",
    border: "border-fuchsia-800/70",
    dot: "bg-fuchsia-400",
  },
  {
    bg: "bg-lime-950/60",
    text: "text-lime-300",
    border: "border-lime-800/70",
    dot: "bg-lime-400",
  },
  {
    bg: "bg-yellow-950/60",
    text: "text-yellow-300",
    border: "border-yellow-800/70",
    dot: "bg-yellow-400",
  },
  {
    bg: "bg-pink-950/60",
    text: "text-pink-300",
    border: "border-pink-800/70",
    dot: "bg-pink-400",
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
  const cleanTag = tag.trim().toLowerCase().replace(/^#/, "");
  if (PRESET_TAG_STYLES[cleanTag]) {
    return PRESET_TAG_STYLES[cleanTag];
  }
  const index = hashString(cleanTag) % DYNAMIC_PALETTES.length;
  return DYNAMIC_PALETTES[index];
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; border: string; badgeBg: string; badgeText: string; iconColor: string }
> = {
  high: {
    label: "اولویت بالا",
    border: "border-r-4 border-r-red-500",
    badgeBg: "bg-red-950/80 border-red-800/70",
    badgeText: "text-red-300",
    iconColor: "text-red-400",
  },
  medium: {
    label: "اولویت متوسط",
    border: "border-r-4 border-r-amber-500",
    badgeBg: "bg-amber-950/80 border-amber-800/70",
    badgeText: "text-amber-300",
    iconColor: "text-amber-400",
  },
  low: {
    label: "اولویت پایین",
    border: "border-r-4 border-r-blue-500/60",
    badgeBg: "bg-blue-950/80 border-blue-800/70",
    badgeText: "text-blue-300",
    iconColor: "text-blue-400",
  },
  none: {
    label: "",
    border: "border-r-4 border-r-transparent",
    badgeBg: "",
    badgeText: "",
    iconColor: "",
  },
};
