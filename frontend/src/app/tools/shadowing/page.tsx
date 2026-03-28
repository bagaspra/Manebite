"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { deleteVideo, getVideos, type Video } from "@/lib/api";
import SubmitForm from "@/components/SubmitForm";
import VideoCard from "@/components/VideoCard";


function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-app-border bg-surface">
      <div className="aspect-video animate-pulse bg-gray-100" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-8 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <svg width="64" height="64" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <rect x="8" y="16" width="56" height="40" rx="4" stroke="#E8E8E0" strokeWidth="2" />
        <path d="M28 36l8-6 8 6" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        <circle cx="36" cy="38" r="2" fill="#C41E3A" opacity="0.4" />
        <path d="M8 24h56" stroke="#E8E8E0" strokeWidth="2" />
        <circle cx="15" cy="20" r="2" fill="#E8E8E0" />
        <circle cx="21" cy="20" r="2" fill="#E8E8E0" />
      </svg>
      <div>
        <p className="text-sm font-medium text-text-primary">Your queue is empty.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Use the{" "}
          <span className="font-medium text-gray-700">Add Video</span>
          {" "}tab to add a YouTube video.
        </p>
      </div>
    </div>
  );
}

// Modal reads searchParams — needs Suspense
function AddVideoModal({ userId, onSuccess }: { userId?: string; onSuccess: (v: Video) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("modal") === "add";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">Add a video</p>
          <button
            onClick={() => router.push("/tools/shadowing")}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <SubmitForm
          userId={userId}
          onSuccess={(video) => {
            onSuccess(video);
            router.push("/tools/shadowing");
          }}
        />
      </div>
    </div>
  );
}

export default function MyQueuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline auth check — redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/tools/shadowing");
    }
  }, [status, router]);

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

  // Show nothing while loading auth or redirecting
  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </main>
    );
  }

  return (
    <>
      <Suspense>
        <AddVideoModal userId={userId} onSuccess={handleSuccess} />
      </Suspense>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight text-text-primary">My Queue</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Videos you&apos;ve added for shadowing practice
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-app-error">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : videos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div key={video.id} className="relative">
                <span
                  className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium"
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
    </>
  );
}
