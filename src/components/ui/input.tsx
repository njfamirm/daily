import { cn } from "@/lib/utils.ts";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-neutral-600",
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
        "w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-neutral-600",
        className,
      )}
      {...props}
    />
  );
}
