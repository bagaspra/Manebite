"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { deleteVideo, getVideos, type Video } from "@/lib/api";
import SubmitForm from "@/components/SubmitForm";
import VideoCard from "@/components/VideoCard";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="aspect-video animate-pulse" style={{ background: "#E8E8E0" }} />
      <div className="space-y-2 p-4">
        <div className="h-3 w-3/4 animate-pulse rounded" style={{ background: "#E8E8E0" }} />
        <div className="h-3 w-1/2 animate-pulse rounded" style={{ background: "#E8E8E0" }} />
        <div className="mt-4 h-8 animate-pulse rounded" style={{ background: "#E8E8E0" }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <rect x="8" y="16" width="56" height="40" rx="4" stroke="#E8E8E0" strokeWidth="2" />
        <path d="M28 36l8-6 8 6" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        <circle cx="36" cy="38" r="2" fill="#C41E3A" opacity="0.4" />
        <path d="M8 24h56" stroke="#E8E8E0" strokeWidth="2" />
        <circle cx="15" cy="20" r="2" fill="#E8E8E0" />
        <circle cx="21" cy="20" r="2" fill="#E8E8E0" />
      </svg>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Your queue is empty.</p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Add a YouTube video to get started.</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadVideos() {
    if (!userId) { setIsLoading(false); return; }
    try {
      const data = await getVideos("mine", userId);
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadVideos(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSuccess(video: Video) {
    setVideos((prev) => prev.some((v) => v.id === video.id) ? prev : [video, ...prev]);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Remove this video from your queue?")) return;
    try {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video.");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Page header + tabs */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>My Queue</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Videos you&apos;ve added for shadowing practice
          </p>
        </div>
        <Link
          href="/library"
          className="rounded border px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Public Library →
        </Link>
      </div>

      {/* Submit form or sign-in banner */}
      <div className="mb-10">
        {session ? (
          <div className="rounded-lg p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
            <SubmitForm onSuccess={handleSuccess} userId={userId} />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg px-6 py-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to add videos to your queue.
            </p>
            <Link href="/login" className="rounded px-4 py-1.5 text-sm font-semibold text-white" style={{ background: "var(--accent)" }}>
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded px-4 py-3 text-sm" style={{ background: "#FEF2F2", color: "var(--error)", border: "1px solid #FECACA" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Content */}
      {!session ? (
        <p className="text-sm text-center py-10" style={{ color: "var(--text-secondary)" }}>
          Sign in to see your personal queue.
        </p>
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div key={video.id} className="relative">
              {/* Public / Private badge */}
              <span
                className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: video.is_public ? "rgba(45,106,79,0.9)" : "rgba(0,0,0,0.55)",
                  color: "#fff",
                }}
              >
                {video.is_public ? "Public" : "Private"}
              </span>
              <VideoCard video={video} onDelete={() => handleDelete(video.id)} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
