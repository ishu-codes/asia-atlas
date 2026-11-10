"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { TIMER_SECONDS, TIMER_WARNING_SECONDS } from "@/lib/quiz";
import { cn } from "@/lib/utils";

type TimerBarProps = {
  running: boolean;
  /** Changes whenever a new question starts, which resets the bar. */
  resetKey: number | string;
  onExpire: () => void;
};

export function TimerBar({ running, resetKey, onExpire }: TimerBarProps) {
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new resetKey intentionally restarts the countdown.
  useEffect(() => {
    setSecondsLeft(TIMER_SECONDS);
  }, [resetKey]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new resetKey intentionally restarts the countdown.
  useEffect(() => {
    if (!running) return;

    const deadline = Date.now() + TIMER_SECONDS * 1000;
    let expired = false;

    const tick = () => {
      const remaining = Math.max(0, (deadline - Date.now()) / 1000);
      setSecondsLeft(remaining);

      if (remaining <= 0 && !expired) {
        expired = true;
        onExpireRef.current();
      }
    };

    tick();
    const interval = window.setInterval(tick, 100);

    return () => window.clearInterval(interval);
  }, [running, resetKey]);

  const warning = secondsLeft <= TIMER_WARNING_SECONDS;
  const percent = Math.max(
    0,
    Math.min(100, (secondsLeft / TIMER_SECONDS) * 100),
  );

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span className="uppercase tracking-[0.12em]">Time</span>
        <span
          className={cn(
            "tabular-nums",
            warning && "text-red-600 dark:text-red-400",
          )}
        >
          {Math.ceil(secondsLeft)}s
        </span>
      </div>
      <Progress
        value={percent}
        aria-label="Time remaining"
        className={cn(
          "flex-col gap-0 [&_[data-slot=progress-track]]:h-1.5",
          warning && "[&_[data-slot=progress-indicator]]:bg-red-500",
        )}
      />
    </div>
  );
}
