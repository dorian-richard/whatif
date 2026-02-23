"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn("relative group/tip inline-flex items-center", className)}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] leading-tight whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50 max-w-[260px] whitespace-normal text-center">
        {content}
      </span>
    </span>
  );
}
