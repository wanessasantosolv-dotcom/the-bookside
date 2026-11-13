import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Fraunces, Inter, Manrope, Playfair_Display, Space_Mono, Special_Elite } from "next/font/google";
import { PerfilHidratacao } from "@/components/PerfilHidratacao";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-special-elite",
});

// estilo "revista" (teste e versão web)
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
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
        {children}
      </body>
    </html>
  );
}
