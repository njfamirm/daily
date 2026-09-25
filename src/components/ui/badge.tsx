import { cn } from "@/lib/utils.ts";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-white text-zinc-950 hover:bg-zinc-200",
        secondary: "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-850",
        destructive: "border-red-800/80 bg-red-950/60 text-red-300",
        outline: "border-zinc-700/80 bg-transparent text-zinc-300",
        warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
