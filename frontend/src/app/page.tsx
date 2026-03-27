import Link from "next/link";

const steps = [
  {
    n: "1",
    title: "Paste a YouTube URL",
    desc: "Any Japanese video with subtitles works — NHK, anime, vlogs.",
  },
  {
    n: "2",
    title: "We extract the sentences",
    desc: "Subtitles are parsed into individual sentences with timestamps.",
  },
  {
    n: "3",
    title: "Shadow sentence by sentence",
    desc: "Listen, repeat, loop — until it feels natural in your mouth.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-20 sm:pt-32 text-center">
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          日本語を学ぼう
        </p>

        <h1
          className="text-5xl font-bold leading-tight sm:text-7xl"
          style={{ color: "var(--text-primary)", fontFamily: "'Noto Serif JP', serif" }}
        >
          学ぼう。
        </h1>

        <p
          className="mt-6 text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Master Japanese through shadowing — hear it, say it, own it.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Start Learning →
          </Link>
          <Link
            href="/dashboard"
            className="rounded border px-8 py-3 text-sm font-semibold transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Browse Videos
          </Link>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section
        className="border-y py-20"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <p
            className="mb-12 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-secondary)" }}
          >
            How it works
          </p>

          <div className="grid gap-10 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="flex flex-col gap-4">
                <span
                  className="text-5xl font-bold"
                  style={{ color: "var(--accent)", fontFamily: "'Noto Serif JP', serif", opacity: 0.25 }}
                >
                  {step.n}
                </span>
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer
        className="border-t py-10 text-center"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Shadowing Queue
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          Built for Japanese learners
        </p>
      </footer>
    </main>
  );
}
