import { cn } from "@/lib/utils.ts";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 font-semibold",
        outline:
          "border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-100",
        ghost: "hover:bg-zinc-800/80 text-zinc-300 hover:text-white",
        danger: "text-red-400 hover:bg-red-500/15 hover:text-red-300",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
