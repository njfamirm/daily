import { cn } from "@/lib/utils.ts";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50",
        className,
      )}
      {...props}
    />
  );
}
