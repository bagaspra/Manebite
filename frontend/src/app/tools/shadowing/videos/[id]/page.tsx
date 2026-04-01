import Link from "next/link";
import { auth } from "@/auth";
import { getVideoDetail } from "@/lib/api";
import VisibilityToggle from "@/components/VisibilityToggle";
import styles from "@/components/GlassUI.module.css";

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

  const glassCardStyle = {
    background: "rgba(255,255,255,0.45)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: "16px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.05), inset 0 1px 0 white",
    overflow: "hidden"
  };

  return (
    <div className={styles.page}>
      <main className={`${styles.mainSection} mx-auto max-w-6xl px-4 py-10 sm:px-6 w-full`} style={{ minHeight: "80vh" }}>
        {/* Breadcrumb - Pill Style */}
        <nav className="mb-8 flex items-center gap-2">
          <Link 
            href="/tools/shadowing" 
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-white/40 backdrop-blur-md rounded-full border border-white/80 hover:bg-white/60 transition-colors"
          >
            ← My Queue
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-800 font-semibold text-sm">Video Detail</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h1 className="text-3xl font-bold leading-snug tracking-tight text-[#1A1A2E] sm:text-4xl" style={{ letterSpacing: "-0.01em" }}>
                {video.title ?? video.youtube_id}
              </h1>
              {video.channel && (
                <p className="mt-3 text-sm font-medium text-gray-500">{video.channel}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="rounded-full border border-white/90 bg-white/50 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
                >
                  {b.label}
                </span>
              ))}
              <span
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-md shadow-sm ${
                  video.is_public
                    ? "border-emerald-200 bg-emerald-100/60 text-emerald-800"
                    : "border-gray-200 bg-gray-100/60 text-gray-600"
                }`}
              >
                {video.is_public ? "Public" : "Private"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-6">
              <Link
                href={`/tools/shadowing/session/${video.id}`}
                className="flex items-center gap-2 rounded-full bg-[#1A1A2E] px-8 py-3 text-sm font-bold text-white transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl hover:bg-[#2d2d45]"
              >
                <span>▶ Start Shadowing</span>
              </Link>
            </div>
          </div>

          {/* Right Column (Video & Toggles) */}
          <div className="space-y-4 lg:col-span-1">
            <div style={glassCardStyle}>
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
              <div style={{ ...glassCardStyle, padding: "4px" }}>
                <VisibilityToggle
                  videoId={video.id}
                  initialIsPublic={video.is_public ?? false}
                  userId={userId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Data Table Preview */}
        {preview.length > 0 && (
          <section className="mt-14" style={{ ...glassCardStyle, borderRadius: "20px" }}>
            <div className="bg-white/20 px-6 py-4 border-b border-white/40">
              <h2 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
                <span className="text-purple-500">❖</span> Preview (First 5 sentences)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/40 text-xs tracking-wider text-gray-500 uppercase bg-white/10">
                    <th className="w-12 px-6 py-4 text-left font-bold">#</th>
                    <th className="px-6 py-4 text-left font-bold">Japanese</th>
                    <th className="hidden px-6 py-4 text-left sm:table-cell font-bold">Romaji</th>
                    <th className="w-24 px-6 py-4 text-right font-bold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {preview.map((s, i) => (
                    <tr key={s.id} className="transition-colors hover:bg-white/30">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-400">
                        {s.sequence_no ?? i + 1}
                      </td>
                      <td
                        className="px-6 py-4 font-medium text-[#1A1A2E] leading-relaxed"
                        style={{ fontFamily: "'Inter', var(--font-noto-sans-jp), sans-serif" }}
                      >
                        {s.text_ja}
                      </td>
                      <td className="hidden px-6 py-4 text-gray-500 sm:table-cell font-medium">
                        {s.text_romaji ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-gray-500">
                        {s.duration != null ? `${s.duration.toFixed(1)}s` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {video.sentence_count > 5 && (
              <div className="bg-white/10 px-6 py-3 border-t border-white/40 text-center text-xs font-semibold text-gray-500">
                … and {video.sentence_count - 5} more sentences locked in the full session
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
