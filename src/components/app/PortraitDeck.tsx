import { Compass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type SpotlightPerson = {
  name: string;
  description: string | null;
  occupation: string | null;
  imageUrl: string;
  ethnicity: string;
};

export function PortraitDeck({
  people,
  loading,
}: {
  people: SpotlightPerson[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="relative mx-auto aspect-[4/5] w-full max-w-md lg:mx-0">
        <Skeleton className="absolute inset-x-6 top-5 bottom-0 rounded-[2rem]" />
        <Skeleton className="absolute inset-x-3 top-2.5 bottom-2.5 rounded-[2rem]" />
        <Skeleton className="absolute inset-x-0 top-0 bottom-5 rounded-[2rem]" />
      </div>
    );
  }

  const [lead, second, third] = people;

  if (!lead) {
    return (
      <div className="atlas-surface flex aspect-[4/5] w-full max-w-md items-center justify-center rounded-[2rem] border border-border bg-card px-8 text-center">
        <div>
          <Compass className="mx-auto size-8 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            The atlas is waiting for its first portrait.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="atlas-portrait-stack relative mx-auto aspect-[4/5] w-full max-w-md lg:mx-0">
      {third ? (
        <div className="absolute inset-x-7 top-7 bottom-0 rotate-[5deg] overflow-hidden rounded-[2rem] border border-border/80 bg-muted shadow-[0_18px_50px_-30px_oklch(0.3_0.04_60/0.45)]">
          {/* biome-ignore lint/performance/noImgElement: Commons URLs are already resized; next/image would add a second resize hop. */}
          <img
            src={third.imageUrl}
            alt=""
            className="h-full w-full object-cover object-top opacity-70"
            draggable={false}
          />
        </div>
      ) : null}
      {second ? (
        <div className="absolute inset-x-3.5 top-3.5 bottom-2 -rotate-[3deg] overflow-hidden rounded-[2rem] border border-border/80 bg-muted shadow-[0_18px_50px_-28px_oklch(0.3_0.04_60/0.42)]">
          {/* biome-ignore lint/performance/noImgElement: Commons URLs are already resized; next/image would add a second resize hop. */}
          <img
            src={second.imageUrl}
            alt=""
            className="h-full w-full object-cover object-top opacity-85"
            draggable={false}
          />
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-0 bottom-5 overflow-hidden rounded-[2rem] border border-border/80 bg-muted shadow-[0_24px_64px_-30px_oklch(0.28_0.04_70/0.55)]">
        {/* biome-ignore lint/performance/noImgElement: Commons URLs are already resized; next/image would add a second resize hop. */}
        <img
          src={lead.imageUrl}
          alt={`Portrait of ${lead.name}`}
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/55 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-[oklch(0.985_0.006_84)]">
          <p className="text-sm font-semibold">A real story is waiting.</p>
          <p className="mt-1 text-xs text-[oklch(0.985_0.006_84/0.8)]">
            Guess first. Meet the person after.
          </p>
        </div>
      </div>
    </div>
  );
}
