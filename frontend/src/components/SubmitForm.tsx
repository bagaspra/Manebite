"use client";

import { useState } from "react";
import { submitVideo, type Video } from "@/lib/api";

type Props = {
  onSuccess: (video: Video) => void;
  userId?: string;
};

export default function SubmitForm({ onSuccess, userId }: Props) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didSucceed, setDidSucceed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setDidSucceed(false);

    try {
      const res = await submitVideo(url.trim(), userId);
      onSuccess(res.video);
      setUrl("");
      setDidSucceed(true);
      setTimeout(() => setDidSucceed(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label
        htmlFor="yt-url"
        className="block text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-secondary)" }}
      >
        Paste YouTube URL
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="yt-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={isLoading}
          className="flex-1 rounded px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="rounded px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto w-full"
          style={{ background: didSucceed ? "var(--success)" : "var(--accent)" }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path
                  fill="currentColor"
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Processing…
            </span>
          ) : didSucceed ? (
            "Added ✓"
          ) : (
            "Add to Queue"
          )}
        </button>
      </div>

      {error && (
        <div
          className="flex items-start justify-between rounded px-4 py-3 text-sm"
          style={{
            background: "#FEF2F2",
            color: "var(--error)",
            border: "1px solid #FECACA",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-4 font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </form>
  );
}
