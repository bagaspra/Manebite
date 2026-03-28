import type { Metadata } from "next";
import { Noto_Serif_JP, Noto_Sans_JP, Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manebite",
  description: "A focused set of tools for learning Japanese the way native speakers use it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${plusJakarta.variable} ${notoSerifJP.variable} ${notoSansJP.variable}`}>
      <body>
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
