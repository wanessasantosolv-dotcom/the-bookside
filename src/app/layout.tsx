import { Aparencia } from "@/components/Aparencia";
import { Celebracao } from "@/components/Celebracao";
import { scriptAparencia } from "@/lib/aparencia";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AvisoOffline } from "@/components/AvisoOffline";
import { PerfilHidratacao } from "@/components/PerfilHidratacao";
import { RastroNavegacao } from "@/components/Voltar";
import "./globals.css";

/*
 * Fontes guardadas no próprio projeto (src/fonts), para o build não depender
 * de baixar nada do Google Fonts. Licenças em src/fonts/README.md.
 */
const playfair = localFont({
  src: [
    {
      path: "../fonts/playfair-display-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/playfair-display-latin-600-italic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../fonts/playfair-display-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/playfair-display-latin-700-italic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const dmSerif = localFont({
  src: [
    {
      path: "../fonts/dm-serif-display-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/dm-serif-display-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-dm-serif",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const specialElite = localFont({
  src: "../fonts/special-elite-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-special-elite",
  display: "swap",
});

// estilo "revista" (teste e versão web)
const fraunces = localFont({
  src: [
    {
      path: "../fonts/fraunces-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../fonts/fraunces-latin-wght-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

const spaceMono = localFont({
  src: [
    {
      path: "../fonts/space-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/space-mono-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "the bookside",
  description:
    "read ✦ track ✦ belong — sua estante, suas leituras e seus clubes.",
  applicationName: "the bookside",
  // no iPhone, "Adicionar à Tela de Início" abre em tela cheia, com este nome e ícone
  appleWebApp: { capable: true, title: "bookside", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#6b0d24",
  width: "device-width",
  initialScale: 1,
  // usa a tela toda no iPhone (o menu de baixo já respeita a barrinha do home)
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${playfair.variable} ${dmSerif.variable} ${inter.variable} ${specialElite.variable} ${fraunces.variable} ${manrope.variable} ${spaceMono.variable}`}
    >
      <head>
        {/* aplica o modo escuro antes de pintar a página */}
        <script dangerouslySetInnerHTML={{ __html: scriptAparencia }} />
      </head>
      <body>
        <PerfilHidratacao />
        <Aparencia />
        <Celebracao />
        <AvisoOffline />
        <RastroNavegacao />
        {children}
      </body>
    </html>
  );
}
