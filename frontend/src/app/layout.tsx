import type { Metadata } from "next";
import { Noto_Serif_JP, Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shadowing Queue",
  description: "Learn Japanese through shadowing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${plusJakarta.variable} ${notoSerifJP.variable}`}>
      <body>
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
