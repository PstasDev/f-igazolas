import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Igazoláskezelő - Szent László Gimnázium F Szekció",
    short_name: "Igazolás",
    description: "Igazoláskezelő rendszer a Szent László Gimnázium F Szekciójának.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0e0e0e",
    theme_color: "#0e0e0e",
    icons: [
      {
        src: "/icons/igazolas-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/igazolas-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/igazolas-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
