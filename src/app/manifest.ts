import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asia Atlas",
    short_name: "Asia Atlas",
    description:
      "A photo quiz about real people from across Asia. Pick an ethnicity, then learn who is behind the photo.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#f7f3ea",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
