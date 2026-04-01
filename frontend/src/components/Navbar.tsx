"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ToolPill from "./ToolPill";
import StreakBadge from "./StreakBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "@/components/GlassUI.module.css";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { t } = useLanguage();

  // Hide the global navbar on tool routes (except admin) and home page
  if (
    pathname === "/" || 
    (pathname.startsWith("/tools") && !pathname.includes("/admin"))
  ) {
    return null;
  }

  const isShadowing  = pathname.startsWith("/tools/shadowing");
  const isKeigo      = pathname.startsWith("/tools/keigo");
  const isHongocut   = pathname.startsWith("/tools/hongocut");
  const isGoipack    = pathname.startsWith("/tools/goipack");
  const isDashboard  = pathname.startsWith("/dashboard") || pathname.startsWith("/settings");
  const isTool = isShadowing || isKeigo || isHongocut || isGoipack;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className={styles.nav}>
        {/* Left */}
        {isTool || isDashboard ? (
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-gray-500 transition-colors hover:text-[#1A1A2E] bg-white/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/60">
              {t("nav_back_home")}
            </Link>
            {isShadowing  && <ToolPill tool="shadowing" />}
            {isKeigo      && <ToolPill tool="keigo" />}
            {isHongocut   && <ToolPill tool="hongocut" />}
            {isGoipack    && <ToolPill tool="goipack" />}
          </div>
        ) : (
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>まね</div>
            Manebite
          </Link>
        )}

        {/* Right */}
        <div className="flex items-center gap-3">
          <StreakBadge />

          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-white/40 backdrop-blur-md border border-white/60" />
          ) : session?.user ? (
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white/60 shadow-sm">
              {/* Avatar → /dashboard */}
              <Link
                href="/dashboard"
                className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                title="Account"
                aria-label="Account"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white/80 group-hover:ring-emerald-400 transition-all shadow-sm"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A2E] text-xs font-bold text-white ring-2 ring-white/80 group-hover:ring-emerald-400 transition-all shadow-sm">
                    {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                {t("nav_sign_out")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={styles.btnNavOutline}
              >
                {t("nav_log_in")}
              </Link>
              <Link
                href="/register"
                className={styles.btnNavDark}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
