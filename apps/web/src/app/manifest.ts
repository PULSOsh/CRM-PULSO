import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PULSO CRM", short_name: "PULSO", description: "CRM operacional da PULSO",
    start_url: "/app/hoje", display: "standalone", background_color: "#F4F2ED",
    theme_color: "#E65318", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
  };
}
