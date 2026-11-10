import { CompassIcon, FlameIcon } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/app/ThemeToggle";
import { useQuiz } from "@/components/quiz/QuizProvider";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { state } = useQuiz();

  return (
    <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border/60 pb-3">
      <Link
        href="/"
        className="flex min-h-11 items-center gap-2 rounded-xl font-heading text-lg font-bold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <CompassIcon className="size-5" aria-hidden="true" />
        </span>
        Asia Atlas
      </Link>

      <div className="flex items-center gap-1.5">
        {state.streak >= 3 ? (
          <Badge variant="secondary" className="h-9 gap-1.5 px-3 tabular-nums">
            <FlameIcon className="size-4 text-orange-600" aria-hidden="true" />
            {state.streak} streak
          </Badge>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
