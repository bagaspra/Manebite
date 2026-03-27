"use client";

import { useState } from "react";
import { toggleVisibility } from "@/lib/api";

type Props = {
  videoId: number;
  initialIsPublic: boolean;
  userId: string;
};

export default function VisibilityToggle({ videoId, initialIsPublic, userId }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    const next = !isPublic;
    setIsPublic(next); // optimistic
    try {
      await toggleVisibility(videoId, next, userId);
    } catch (err) {
      setIsPublic(!next); // revert
      setError(err instanceof Error ? err.message : "Failed to update visibility.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
        Visibility
      </p>

      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm transition-colors"
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg)",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {isPublic ? "Public" : "Private"}
        </span>
        {/* Toggle pill */}
        <span
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          style={{ background: isPublic ? "var(--accent)" : "var(--border)" }}
        >
          <span
            className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
            style={{ transform: isPublic ? "translateX(18px)" : "translateX(2px)" }}
          />
        </span>
      </button>

      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {isPublic
          ? "Anyone can find and shadow this video in the Public Library."
          : "Only you can see this video in your queue."}
      </p>

      {error && (
        <p className="text-xs" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
