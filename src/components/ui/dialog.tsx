import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { X } from "lucide-react";
import { type ComponentProps, type ReactNode, useEffect } from "react";

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange?.(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </div>
  );
}

export function DialogContent({
  className,
  children,
  onClose,
  showClose = true,
  ...props
}: ComponentProps<"div"> & { onClose?: () => void; showClose?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-150",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
      {showClose && onClose && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={onClose}
          className="absolute end-4 top-4 text-zinc-400 hover:text-zinc-100"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-1.5 text-start pb-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4",
        className,
      )}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-base font-semibold leading-none tracking-tight text-zinc-100", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-xs text-zinc-400 leading-relaxed", className)} {...props} />;
}
