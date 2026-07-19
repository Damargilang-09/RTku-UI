import { cn } from "@/src/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]",
        className,
      )}
      {...props}
    />
  );
}
