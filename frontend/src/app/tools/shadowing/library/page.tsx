"use client";

import { useEffect, useState } from "react";
import { getVideos, type Video } from "@/lib/api";
import VideoCard from "@/components/VideoCard";

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getVideos("public")
      .then(setVideos)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = search.trim()
    ? videos.filter(
        (v) =>
          v.title?.toLowerCase().includes(search.toLowerCase()) ||
          v.channel?.toLowerCase().includes(search.toLowerCase())
      )
    : videos;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-text-primary">Public Library</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Community-shared Japanese shadowing videos — no sign-in required.
        </p>
      </div>

      <div className="mb-8">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or channel…"
          className="w-full max-w-md rounded-md border border-app-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none focus:border-gray-400"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-app-border bg-surface">
              <div className="aspect-video animate-pulse bg-gray-100" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="mt-4 h-8 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm font-medium text-text-primary">
            {search ? "No videos match your search." : "No public videos yet."}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {search
              ? "Try a different keyword."
              : "Submit a video and toggle it public to share with the community."}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-text-secondary">
            {filtered.length} video{filtered.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
