"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ShadowingSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // "My Queue" is active for /tools/shadowing and /tools/shadowing?modal=add
  const isQueue = pathname === "/tools/shadowing";
  const isLibrary = pathname === "/tools/shadowing/library";
  // Add Video "tab" is active when modal=add is in the URL
  const isAddVideo = isQueue && searchParams.get("modal") === "add";

  const tabBase = "px-1 pb-2.5 text-sm transition-colors";
  const active = `${tabBase} font-medium text-gray-900 border-b-2 border-gray-900`;
  const inactive = `${tabBase} text-gray-400 hover:text-gray-600 border-b-2 border-transparent`;

  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pt-3 sm:px-6">
        <Link
          href="/tools/shadowing"
          className={isQueue && !isAddVideo ? active : inactive}
        >
          My Queue
        </Link>
        <Link
          href="/tools/shadowing/library"
          className={isLibrary ? active : inactive}
        >
          Library
        </Link>
        {/* Add Video opens a modal via search param — only shown on My Queue page */}
        {isQueue && (
          <Link
            href="/tools/shadowing?modal=add"
            className={isAddVideo ? active : inactive}
          >
            Add Video
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function ShadowingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <ShadowingSubNav />
      </Suspense>
      {children}
    </>
  );
}
