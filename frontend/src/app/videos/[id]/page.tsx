import Link from "next/link";
import { auth } from "@/auth";
import { getVideoDetail } from "@/lib/api";
import VisibilityToggle from "@/components/VisibilityToggle";

type Props = { params: Promise<{ id: string }> };

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;
  const [video, session] = await Promise.all([getVideoDetail(Number(id)), auth()]);

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const isOwner = !!userId && video.submitted_by === userId;

  const preview = video.sentences.slice(0, 5);

  const badges = [
    { label: `${video.sentence_count} sentences` },
    { label: "Japanese" },
    ...(video.difficulty ? [{ label: video.difficulty }] : []),
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <span>→</span>
        <span style={{ color: "var(--text-primary)" }}>Video Detail</span>
      </nav>

      {/* Main split layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1
              className="text-2xl font-bold leading-snug sm:text-3xl"
              style={{ color: "var(--text-primary)" }}
            >
              {video.title ?? video.youtube_id}
            </h1>
            {video.channel && (
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                {video.channel}
              </p>
            )}
          </div>

          {/* Badge row */}
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.label}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: "#F3F3F0",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {b.label}
              </span>
            ))}
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: video.is_public ? "rgba(45,106,79,0.1)" : "#F3F3F0",
                color: video.is_public ? "var(--success)" : "var(--text-secondary)",
                border: `1px solid ${video.is_public ? "rgba(45,106,79,0.3)" : "var(--border)"}`,
              }}
            >
              {video.is_public ? "Public" : "Private"}
            </span>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/session/${video.id}`}
              className="rounded px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Start Shadowing →
            </Link>
            <Link
              href="/dashboard"
              className="rounded border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Right — 1/3: YouTube embed + owner controls */}
        <div className="lg:col-span-1 space-y-4">
          <div
            className="overflow-hidden rounded-lg"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
          >
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtube_id}`}
                title={video.title ?? video.youtube_id}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>

          {/* Visibility toggle — owner only */}
          {isOwner && (
            <VisibilityToggle
              videoId={video.id}
              initialIsPublic={video.is_public ?? false}
              userId={userId}
            />
          )}
        </div>
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <section className="mt-12">
          <h2
            className="mb-5 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-secondary)" }}
          >
            Preview — First 5 Sentences
          </h2>

          <div
            className="overflow-hidden rounded-lg"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b text-xs font-semibold uppercase tracking-wider"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  <th className="px-4 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">Japanese</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Romaji</th>
                  <th className="px-4 py-3 text-right w-20">Duration</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((s, i) => (
                  <tr
                    key={s.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td
                      className="px-4 py-3 font-mono text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {s.sequence_no ?? i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                      {s.text_ja}
                    </td>
                    <td
                      className="px-4 py-3 hidden sm:table-cell"
                      style={{ color: s.text_romaji ? "var(--text-secondary)" : "#C0C0C0" }}
                    >
                      {s.text_romaji ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {s.duration != null ? `${s.duration.toFixed(1)}s` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {video.sentence_count > 5 && (
            <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
              … and {video.sentence_count - 5} more sentences in the full session.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
