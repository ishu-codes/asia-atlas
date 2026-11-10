"use client";

import { ExternalLink, MapPin, Quote } from "lucide-react";
import { EthnicityFlag } from "@/components/quiz/EthnicityFlag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { QuizReveal } from "@/lib/quiz";

type RevealCardProps = {
  open: boolean;
  reveal: QuizReveal;
};

function RevealContent({ reveal }: { reveal: QuizReveal }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          The answer
        </p>
        <div className="flex items-center gap-2">
          <EthnicityFlag ethnicity={reveal.ethnicity} />
          <p className="text-lg font-semibold text-foreground">
            {reveal.ethnicity}
          </p>
        </div>
        <h3 className="font-heading text-2xl leading-tight text-foreground">
          {reveal.name}
        </h3>
        {reveal.description ? (
          <p className="text-sm leading-snug text-muted-foreground">
            {reveal.description}
          </p>
        ) : null}
      </div>

      {reveal.occupation || reveal.birthPlace ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {reveal.occupation ? (
            <Badge variant="secondary" className="gap-1">
              <Quote className="size-3" aria-hidden="true" />
              {reveal.occupation}
            </Badge>
          ) : null}
          {reveal.birthPlace ? (
            <Badge variant="outline" className="gap-1">
              <MapPin className="size-3" aria-hidden="true" />
              {reveal.birthPlace}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm">
        {reveal.wikipediaEnUrl ? (
          <a
            href={reveal.wikipediaEnUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-12 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            Wikipedia
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
        <a
          href={reveal.commonsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-12 items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Photo: Wikimedia Commons
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function RevealCard({ open, reveal }: RevealCardProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    if (!open) return null;
    return (
      <Card
        size="sm"
        className="mx-auto w-full max-w-lg border border-border/70 ring-0 shadow-sm"
      >
        <CardContent>
          <RevealContent reveal={reveal} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={() => undefined}
      modal={false}
      showSwipeHandle
      swipeDirection="down"
    >
      <DrawerContent className="max-h-[68dvh] pb-24">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{reveal.name}</DrawerTitle>
          <DrawerDescription>
            Who this person is, and where the photo came from.
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-4 pb-4">
          <RevealContent reveal={reveal} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
