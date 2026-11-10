"use client";

import { useEffect, useRef, useState } from "react";

export type ImageStatus = "loading" | "ready" | "failed";

type PreloadEntry = {
  image: HTMLImageElement;
  status: ImageStatus;
  promise: Promise<ImageStatus>;
};

/**
 * Module-level cache so the setup screen and the quiz screen share decoded
 * images and so route changes do not throw them away.
 */
const preloadCache = new Map<string, PreloadEntry>();

function isBrowser() {
  return typeof window !== "undefined";
}

function startPreload(url: string): PreloadEntry {
  const cached = preloadCache.get(url);
  if (cached) return cached;

  const image = new Image();

  if (!url) {
    return { image, status: "failed", promise: Promise.resolve("failed") };
  }
  const entry: PreloadEntry = {
    image,
    status: "loading",
    promise: Promise.resolve<ImageStatus>("loading"),
  };

  image.src = url;
  entry.promise = image.decode().then(
    () => {
      entry.status = "ready";
      return "ready" as const;
    },
    () => {
      entry.status = "failed";
      return "failed" as const;
    },
  );

  preloadCache.set(url, entry);
  return entry;
}

export function preloadImage(url: string): Promise<ImageStatus> {
  if (!isBrowser()) return Promise.resolve("loading");
  return startPreload(url).promise;
}

export async function preloadImages(
  urls: readonly string[],
): Promise<ImageStatus[]> {
  if (!isBrowser()) return urls.map(() => "loading" as const);
  return Promise.all(urls.map((url) => preloadImage(url)));
}

export function getImageStatus(url: string): ImageStatus {
  return preloadCache.get(url)?.status ?? "loading";
}

/**
 * Loads the next `ahead` photos whenever the current question changes. Image
 * objects are held in a ref so the browser keeps the decoded bitmap alive.
 */
export function usePreloadImages(
  urls: readonly string[],
  currentIndex: number,
  ahead = 3,
) {
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (!isBrowser()) return;

    const targets = urls.slice(currentIndex + 1, currentIndex + 1 + ahead);
    for (const url of targets) {
      const entry = startPreload(url);

      if (entry.status === "ready") {
        imagesRef.current.set(url, entry.image);
        continue;
      }

      void entry.promise.then((status) => {
        if (status === "ready") {
          imagesRef.current.set(url, entry.image);
        }
      });
    }
  }, [urls, currentIndex, ahead]);

  return imagesRef;
}

/**
 * Tracks decode state for one URL. Renders a skeleton until `ready`; a `failed`
 * result tells the caller to skip the question.
 */
export function useImageStatus(url: string): ImageStatus {
  const [state, setState] = useState<{ url: string; status: ImageStatus }>(
    () => ({
      url,
      status: getImageStatus(url),
    }),
  );

  useEffect(() => {
    let active = true;
    const entry = startPreload(url);

    setState({ url, status: entry.status });

    if (entry.status === "loading") {
      void entry.promise.then((status) => {
        if (active) setState({ url, status });
      });
    }

    return () => {
      active = false;
    };
  }, [url]);

  return state.url === url ? state.status : getImageStatus(url);
}
