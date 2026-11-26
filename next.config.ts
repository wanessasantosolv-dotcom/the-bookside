import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "ler junto" virou co-read: links, favoritos e convites antigos continuam funcionando
  // (o ?codigo= do convite segue junto no redirecionamento)
  async redirects() {
    return [
      { source: "/ler-junto", destination: "/co-read", permanent: true },
      { source: "/ler-junto/novo", destination: "/co-read/novo", permanent: true },
      { source: "/ler-junto/:id", destination: "/co-read/:id", permanent: true },
    ];
  },
};

export default nextConfig;
