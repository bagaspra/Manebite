import type { Metadata } from "next";
import { Noto_Serif_JP, Noto_Sans_JP, Plus_Jakarta_Sans, Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="ja" className={cn(plusJakarta.variable, notoSerifJP.variable, notoSansJP.variable, "font-sans", geist.variable)}>
      <body>
        <SessionProvider>
          <LanguageProvider>
            <Navbar />
            <Toaster position="top-center" richColors />
            {children}
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
