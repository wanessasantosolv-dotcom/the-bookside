import type { MetadataRoute } from "next";

/** Deixa o site instalável como app (iPhone: Safari → compartilhar → Adicionar à Tela de Início). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "the bookside",
    short_name: "bookside",
    description: "read ✦ track ✦ belong — sua estante, suas leituras e seus clubes.",
    lang: "pt-BR",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F4EE",
    theme_color: "#692536",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
