import Link from "next/link";
import type { Video } from "@/lib/api";

type Props = {
  video: Video;
  onDelete?: () => void;
};

export default function VideoCard({ video, onDelete }: Props) {
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-lg transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
          alt={video.title ?? video.youtube_id}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Sentence count badge */}
        <span
          className="absolute bottom-2 right-2 rounded px-2 py-0.5 text-xs font-semibold text-white"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          {video.sentence_count} sentences
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {video.title ?? video.youtube_id}
          </h3>
          {video.channel && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              {video.channel}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/videos/${video.id}`}
            className="flex-1 rounded py-1.5 text-center text-xs font-semibold text-white transition-colors"
            style={{ background: "var(--accent)" }}
            onMouseOver={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--accent-hover)")
            }
            onMouseOut={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--accent)")
            }
          >
            Shadow →
          </Link>

          {onDelete && (
            <button
              onClick={onDelete}
              aria-label="Delete video"
              className="rounded p-1.5 transition-colors hover:bg-red-50"
              style={{ color: "var(--error)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
