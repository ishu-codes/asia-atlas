/**
 * Turns a full-size Wikimedia Commons file URL into a thumbnail URL.
 *
 * The stored URLs look like:
 *   https://upload.wikimedia.org/wikipedia/commons/d/df/Example.jpg
 * and we turn them into:
 *   https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg?width=600
 *
 * TODO: download and resize photos into our own storage. Hotlinking Commons is
 * rate-limited, and this redirect endpoint is not intended as a CDN.
 */
export function toThumbUrl(imageUrl: string, width = 600): string {
  try {
    const url = new URL(imageUrl);
    const fileName = url.pathname.split("/").filter(Boolean).at(-1);

    if (!fileName) return imageUrl;

    const decodedName = decodeURIComponent(fileName);
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(decodedName)}?width=${width}`;
  } catch {
    return imageUrl;
  }
}
