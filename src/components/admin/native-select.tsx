import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Native <select> styled like shadcn inputs: light and accessible in dense forms. */
export function NativeSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 [&>option]:bg-popover",
        className,
      )}
      {...props}
    />
  );
}
