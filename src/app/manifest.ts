import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sreevarshan Sathiyamurthy — AI, Data & Software Engineer",
    short_name: "SS",
    start_url: "/",
    display: "standalone",
    background_color: "#08090c",
    theme_color: "#08090c",
    icons: [{ src: "/icon", sizes: "64x64", type: "image/png" }],
  };
}
