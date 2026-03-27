"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-end gap-2">
          <span
            className="text-4xl leading-none font-bold select-none"
            style={{ color: "var(--accent)", fontFamily: "'Noto Serif JP', serif" }}
          >
            影
          </span>
          <span
            className="mb-0.5 text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--text-secondary)", letterSpacing: "0.15em" }}
          >
            Shadowing Queue
          </span>
        </Link>

        {/* Right nav */}
        <nav className="flex items-center gap-3">
          <Link
            href="/library"
            className="hidden sm:block text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            Library
          </Link>
          <Link
            href="/dashboard"
            className="hidden sm:block text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            Dashboard
          </Link>

          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded" style={{ background: "var(--border)" }} />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded px-3 py-1.5 text-xs font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded px-4 py-1.5 text-sm font-semibold border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--surface)" }}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
