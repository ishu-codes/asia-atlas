"use client";

import { Globe } from "lucide-react";
import { countryCodeForEthnicity } from "@/lib/flags";
import { cn } from "@/lib/utils";

export function EthnicityFlag({
  ethnicity,
  className,
}: {
  ethnicity: string;
  className?: string;
}) {
  const country = countryCodeForEthnicity(ethnicity);

  if (!country) {
    return (
      <Globe
        aria-hidden="true"
        className={cn("size-5 shrink-0 text-muted-foreground", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "fi shrink-0 rounded-[2px] text-lg leading-none shadow-xs",
        `fi-${country}`,
        className,
      )}
    />
  );
}
