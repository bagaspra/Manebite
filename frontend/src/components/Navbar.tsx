"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ToolPill from "./ToolPill";
import StreakBadge from "./StreakBadge";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isShadowing = pathname.startsWith("/tools/shadowing");
  const isKeigo = pathname.startsWith("/tools/keigo");
  const isHongocut = pathname.startsWith("/tools/hongocut");
  const isTool = isShadowing || isKeigo || isHongocut;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Left: logo or back + tool pill */}
        {isTool ? (
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              ← Home
            </Link>
            {isShadowing && <ToolPill tool="shadowing" />}
            {isKeigo && <ToolPill tool="keigo" />}
            {isHongocut && <ToolPill tool="hongocut" />}
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded bg-gray-900 text-xs text-white"
              style={{ fontFamily: "var(--font-noto-serif-jp), 'Noto Serif JP', serif" }}
            >
              まね
            </span>
            <span className="text-sm font-medium text-gray-900">Manebite</span>
          </Link>
        )}

        {/* Right: streak + auth */}
        <div className="flex items-center gap-3">
          <StreakBadge />

          {status === "loading" ? (
            <div className="h-7 w-16 animate-pulse rounded bg-gray-100" />
          ) : session?.user ? (
            <div className="flex items-center gap-2">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                  {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
