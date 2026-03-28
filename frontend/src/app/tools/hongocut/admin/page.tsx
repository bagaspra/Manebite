"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { hcSubmitVideo, hcGetVideos, hcDeleteVideo, type HcVideo } from "@/lib/api";

const ADMIN_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function isAdmin(userId?: string | null): boolean {
  return !!userId && ADMIN_IDS.includes(userId);
}

export default function HongoCutAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [videos, setVideos] = useState<HcVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Auth guard: redirect if not admin once session resolves
  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin(userId)) {
      router.replace("/tools/hongocut");
    }
  }, [status, userId, router]);

  useEffect(() => {
    if (!isAdmin(userId)) return;
    loadVideos();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVideos() {
    if (!userId) return;
    setLoadingVideos(true);
    try {
      const data = await hcGetVideos(userId);
      setVideos(data);
    } catch {
      // silently ignore
    } finally {
      setLoadingVideos(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !url.trim()) return;
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const video = await hcSubmitVideo(url.trim(), userId);
      setSubmitStatus({
        ok: true,
        msg: `Done — ${video.word_count} words from ${video.sentence_count} sentences indexed.`,
      });
      setUrl("");
      loadVideos();
    } catch (err) {
      setSubmitStatus({
        ok: false,
        msg: err instanceof Error ? err.message : "Failed to process video.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(video: HcVideo) {
    if (!userId) return;
    if (!confirm(`Delete "${video.title ?? video.youtube_id}"?\nThis will remove the video and all its HongoCut data.`)) return;
    setDeletingId(video.id);
    try {
      await hcDeleteVideo(video.id, userId);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  // Loading / access check
  if (status === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
      </div>
    );
  }

  if (!isAdmin(userId)) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      <div className="mb-8">
        <p className="mb-1 text-xs tracking-widest text-gray-400">HONGOCUT · ADMIN</p>
        <h1 className="text-xl font-medium text-gray-900">Video Management</h1>
      </div>

      {/* Submit form */}
      <section className="mb-10 rounded-lg border border-gray-100 p-6">
        <h2 className="mb-4 text-sm font-medium text-gray-700">Process a new video</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            required
          />
          <button
            type="submit"
            disabled={submitting || !url.trim()}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {submitting ? "Processing..." : "Process Video"}
          </button>
        </form>

        {submitting && (
          <p className="mt-3 text-xs text-gray-400">
            Fetching subtitles and tokenizing words — this may take a moment...
          </p>
        )}

        {submitStatus && (
          <p className={`mt-3 text-sm ${submitStatus.ok ? "text-emerald-600" : "text-red-500"}`}>
            {submitStatus.msg}
          </p>
        )}
      </section>

      {/* Video list */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-gray-700">
          Indexed videos
          {videos.length > 0 && <span className="ml-2 text-gray-400">({videos.length})</span>}
        </h2>

        {loadingVideos ? (
          <div className="flex justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
          </div>
        ) : videos.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No videos indexed yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-400">
                  <th className="px-4 py-3 font-medium">Video</th>
                  <th className="px-3 py-3 font-medium text-right">Sentences</th>
                  <th className="px-3 py-3 font-medium text-right">Words</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <img
                          src={`https://img.youtube.com/vi/${video.youtube_id}/default.jpg`}
                          alt=""
                          className="h-9 w-16 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {video.title ?? video.youtube_id}
                          </p>
                          {video.channel && (
                            <p className="truncate text-xs text-gray-400">{video.channel}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">{video.sentence_count}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{video.word_count}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(video)}
                        disabled={deletingId === video.id}
                        className="rounded border border-red-100 px-3 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingId === video.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
