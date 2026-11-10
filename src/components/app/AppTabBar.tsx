"use client";

import { BookOpen, House, Play } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/setup", label: "Play", icon: Play },
  { href: "/onboarding", label: "How to play", icon: BookOpen },
] as const;

export function AppTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App navigation"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-[1.6rem] border border-border/80 bg-background/92 p-1.5 shadow-[0_16px_44px_-18px_oklch(0.28_0.04_70/0.48)] backdrop-blur-xl supports-[not(backdrop-filter:blur(0))]:bg-background">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.15rem] px-2 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon
                className="size-5"
                strokeWidth={active ? 2.25 : 1.8}
                aria-hidden="true"
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
