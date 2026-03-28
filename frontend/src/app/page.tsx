"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

function SpeakerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function LinesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

const tools = [
  {
    key: "shadowing",
    name: "Shadowing Queue",
    desc: "Shadow YouTube videos sentence by sentence",
    href: "/tools/shadowing",
    active: true,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    badge: "Active",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Icon: SpeakerIcon,
  },
  {
    key: "keigo",
    name: "Keigo Translator",
    desc: "Convert casual Japanese to formal business speech",
    href: "/tools/keigo",
    active: true,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    badge: "Active",
    badgeClass: "bg-violet-50 text-violet-700 border border-violet-200",
    Icon: LinesIcon,
  },
  {
    key: "grammar",
    name: "Grammar Matcher",
    desc: "Match sentences to the grammar patterns they use",
    href: "#",
    active: false,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-400",
    badge: "Coming soon",
    badgeClass: "bg-gray-100 text-gray-400 border border-gray-200",
    Icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    key: "more",
    name: "More tools",
    desc: "New tools are being designed and built",
    href: "#",
    active: false,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-400",
    badge: "Coming soon",
    badgeClass: "bg-gray-100 text-gray-400 border border-gray-200",
    Icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-10">
      {/* Hero */}
      <section className="mb-10 text-center">
        <p className="mb-3 text-xs tracking-widest text-gray-400">
          まねして · 磨いて · 上達する
        </p>
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">
          Learn Japanese the way<br />native speakers use it
        </h1>
        <p className="mt-2 text-xs tracking-widest text-gray-400">
          shadowing · keigo · grammar
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-500">
          A focused set of tools to build real Japanese fluency —<br className="hidden sm:block" />
          not test scores.
        </p>

        <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Link
            href={session ? "/tools/shadowing" : "/login?callbackUrl=/tools/shadowing"}
            className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            Start learning →
          </Link>
          <Link
            href="/tools/keigo"
            className="rounded-md border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Try as guest
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto mb-6 h-px w-8 bg-gray-200" />

      {/* Tool grid */}
      <p className="mb-3 text-center text-xs tracking-widest text-gray-400">CHOOSE A TOOL</p>

      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const card = (
            <div
              className={`group relative rounded-lg border border-gray-100 p-4 transition-colors ${
                tool.active
                  ? "cursor-pointer hover:border-gray-300 hover:bg-gray-50"
                  : "cursor-default opacity-40"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className={`rounded-md p-1.5 ${tool.iconBg} ${tool.iconColor}`}>
                  <tool.Icon />
                </div>
                {tool.active && (
                  <span className="text-gray-300 transition-colors group-hover:text-gray-600">
                    <ArrowIcon />
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900">{tool.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{tool.desc}</p>
              <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${tool.badgeClass}`}>
                {tool.badge}
              </span>
            </div>
          );

          return tool.active ? (
            <Link key={tool.key} href={tool.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={tool.key} className="pointer-events-none">
              {card}
            </div>
          );
        })}
      </div>
    </main>
  );
}
