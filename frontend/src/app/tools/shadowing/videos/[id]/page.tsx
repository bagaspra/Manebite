import Link from "next/link";
import { auth } from "@/auth";
import { getVideoDetail } from "@/lib/api";
import VisibilityToggle from "@/components/VisibilityToggle";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const video = await getVideoDetail(Number(id));
    return { title: `${video.title ?? "Video"} — Manebite` };
  } catch {
    return { title: "Video — Manebite" };
  }
}

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
      <nav className="mb-8 flex items-center gap-2 text-xs text-text-secondary">
        <Link href="/tools/shadowing" className="hover:underline">
          My Queue
        </Link>
        <span>→</span>
        <span className="text-text-primary">Video Detail</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-medium leading-snug tracking-tight text-text-primary sm:text-3xl">
              {video.title ?? video.youtube_id}
            </h1>
            {video.channel && (
              <p className="mt-2 text-sm text-text-secondary">{video.channel}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.label}
                className="rounded-full border border-app-border bg-gray-50 px-3 py-1 text-xs text-text-secondary"
              >
                {b.label}
              </span>
            ))}
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                video.is_public
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-app-border bg-gray-50 text-text-secondary"
              }`}
            >
              {video.is_public ? "Public" : "Private"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/tools/shadowing/session/${video.id}`}
              className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              Start Shadowing →
            </Link>
            <Link
              href="/tools/shadowing"
              className="rounded-md border border-app-border px-6 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-4 lg:col-span-1">
          <div className="overflow-hidden rounded-lg border border-app-border shadow-sm">
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

          {isOwner && (
            <VisibilityToggle
              videoId={video.id}
              initialIsPublic={video.is_public ?? false}
              userId={userId}
            />
          )}
        </div>
      </div>

      {preview.length > 0 && (
        <section className="mt-12">
          <p className="mb-5 text-xs tracking-widest text-text-secondary uppercase">
            Preview — First 5 Sentences
          </p>

          <div className="overflow-hidden rounded-lg border border-app-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border text-xs tracking-wider text-text-secondary uppercase">
                  <th className="w-8 px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Japanese</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Romaji</th>
                  <th className="w-20 px-4 py-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((s, i) => (
                  <tr key={s.id} className="border-b border-app-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {s.sequence_no ?? i + 1}
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-text-primary"
                      style={{ fontFamily: "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif" }}
                    >
                      {s.text_ja}
                    </td>
                    <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">
                      {s.text_romaji ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
                      {s.duration != null ? `${s.duration.toFixed(1)}s` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {video.sentence_count > 5 && (
            <p className="mt-3 text-xs text-text-secondary">
              … and {video.sentence_count - 5} more sentences in the full session.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
