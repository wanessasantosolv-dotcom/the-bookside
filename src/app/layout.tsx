import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AvisoOffline } from "@/components/AvisoOffline";
import { PerfilHidratacao } from "@/components/PerfilHidratacao";
import "./globals.css";

/*
 * Fontes guardadas no próprio projeto (src/fonts), para o build não depender
 * de baixar nada do Google Fonts. Licenças em src/fonts/README.md.
 */
const playfair = localFont({
  src: [
    { path: "../fonts/playfair-display-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/playfair-display-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "../fonts/playfair-display-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/playfair-display-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const dmSerif = localFont({
  src: [
    { path: "../fonts/dm-serif-display-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/dm-serif-display-latin-400-italic.woff2", weight: "400", style: "italic" },
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
    { path: "../fonts/fraunces-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/fraunces-latin-wght-italic.woff2", weight: "100 900", style: "italic" },
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
    { path: "../fonts/space-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/space-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "the bookside",
  description: "read ✦ track ✦ belong — sua estante, suas leituras e seus clubes.",
};

export const viewport: Viewport = {
  themeColor: "#6b0d24",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${dmSerif.variable} ${inter.variable} ${specialElite.variable} ${fraunces.variable} ${manrope.variable} ${spaceMono.variable}`}
    >
      <body>
        <PerfilHidratacao />
        <AvisoOffline />
        {children}
      </body>
    </html>
  );
}
