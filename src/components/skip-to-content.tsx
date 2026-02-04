
'use client';

import { cn } from "@/lib/utils";

/**
 * @fileOverview A skip-to-content link for keyboard accessibility.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1000]",
        "focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "font-bold uppercase tracking-widest text-xs"
      )}
    >
      Skip to main content
    </a>
  );
}
