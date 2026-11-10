"use client";

import { EthnicityFlag } from "@/components/quiz/EthnicityFlag";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type OptionListStatus = {
  confirmed: boolean;
  correct: string;
};

type OptionListProps = {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  status: OptionListStatus;
};

export function OptionList({
  options,
  value,
  onChange,
  status,
}: OptionListProps) {
  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={(nextValue) => onChange(nextValue)}
      disabled={status.confirmed}
      className="gap-2"
    >
      {options.map((option) => {
        const checked = value === option;
        const isCorrect = status.confirmed && option === status.correct;
        const isWrong =
          status.confirmed && checked && option !== status.correct;

        return (
          // biome-ignore lint/a11y/noLabelWithoutControl: Base UI renders a hidden radio input inside this label.
          <label
            key={option}
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
              "flex min-h-12 w-full cursor-pointer touch-manipulation items-center gap-3 rounded-xl border-2 bg-card px-3.5 py-2 transition-colors",
              !status.confirmed &&
                "border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary/5",
              "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
              isCorrect && "border-emerald-600 bg-emerald-50 text-emerald-950",
              isWrong && "border-red-600 bg-red-50 text-red-950",
              status.confirmed && "cursor-default",
            )}
          >
            <RadioGroupItem
              value={option}
              className={cn(
                "size-5",
                isCorrect &&
                  "border-emerald-700 data-checked:border-emerald-700 data-checked:bg-emerald-700",
                isWrong &&
                  "border-red-700 data-checked:border-red-700 data-checked:bg-red-700",
              )}
            />
            <EthnicityFlag ethnicity={option} />
            <span className="min-w-0 flex-1 text-left text-[15px] font-medium">
              {option}
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
