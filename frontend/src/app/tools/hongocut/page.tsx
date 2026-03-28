"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  hcSearch,
  hcSearchSuggestions,
  hcGetPopularWords,
  type HcSearchResult,
  type HcSuggestion,
} from "@/lib/api";

// ── HcClipCard ─────────────────────────────────────────────────────────────────

function highlightWord(text: string, surface: string): string {
  if (!surface) return text;
  return text.replace(new RegExp(surface, "g"), `<mark class="bg-amber-100 text-amber-900 rounded px-0.5">${surface}</mark>`);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function HcClipCard({ result }: { result: HcSearchResult }) {
  const [playing, setPlaying] = useState(false);
  const start = Math.floor(result.start_time);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white transition-shadow hover:shadow-sm">
      {/* Video area */}
      <div className="relative aspect-video bg-gray-100">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${result.youtube_id}?start=${start}&autoplay=1`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center"
            aria-label="Play clip"
          >
            <img
              src={`https://img.youtube.com/vi/${result.youtube_id}/mqdefault.jpg`}
              alt={result.title ?? ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white transition-transform group-hover:scale-110">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
          </button>
        )}
      </div>

      {/* Sentence */}
      <div className="px-4 pt-3">
        <p
          className="text-sm leading-relaxed text-gray-900"
          style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}
          dangerouslySetInnerHTML={{ __html: highlightWord(result.text_ja, result.surface) }}
        />
        {result.text_romaji && (
          <p className="mt-0.5 text-xs text-gray-400">{result.text_romaji}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 px-4 py-3 text-xs text-gray-400">
        {result.channel && (
          <span className="flex items-center gap-1 truncate">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" />
            </svg>
            {result.channel}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {formatTime(result.start_time)}
        </span>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function HongoCutPage() {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState(""); // last searched query
  const [results, setResults] = useState<HcSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<HcSuggestion[]>([]);
  const [popular, setPopular] = useState<HcSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const PAGE = 20;

  // Load popular words on mount
  useEffect(() => {
    hcGetPopularWords().then(setPopular).catch(() => {});
  }, []);

  // Autocomplete — debounced 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const s = await hcSearchSuggestions(query.trim());
        setSuggestions(s);
        setShowSuggestions(s.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [query]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setCommitted(q.trim());
    setShowSuggestions(false);
    setSuggestions([]);
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const data = await hcSearch(q.trim(), 0, PAGE);
      setResults(data);
      setHasMore(data.length === PAGE);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const data = await hcSearch(committed, results.length, PAGE);
      setResults((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE);
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false);
    }
  }, [committed, results.length]);

  const pickSuggestion = (s: HcSuggestion) => {
    const word = s.base_form ?? s.surface;
    setQuery(word);
    setShowSuggestions(false);
    doSearch(word);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") doSearch(query);
    if (e.key === "Escape") setShowSuggestions(false);
  };

  const searched = committed !== "";

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs tracking-widest text-gray-400">HONGOCUT</p>
        <h1 className="text-xl font-medium text-gray-900">
          Search any Japanese word
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Watch native speakers use it in real context
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="例: 買う、食べる、仕事..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                      onMouseDown={() => pickSuggestion(s)}
                    >
                      <span
                        className="font-medium text-gray-900"
                        style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}
                      >
                        {s.surface}
                      </span>
                      {s.reading && s.reading !== s.surface && (
                        <span className="text-gray-400">{s.reading}</span>
                      )}
                      {s.base_form && s.base_form !== s.surface && (
                        <span className="ml-auto text-xs text-gray-300">{s.base_form}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => doSearch(query)}
            disabled={loading || !query.trim()}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            Search
          </button>
        </div>
      </div>

      {/* States */}

      {/* Empty state: popular words */}
      {!searched && !loading && (
        <div className="text-center">
          {popular.length > 0 ? (
            <>
              <p className="mb-3 text-xs tracking-widest text-gray-400">POPULAR WORDS</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popular.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(w.base_form ?? w.surface); doSearch(w.base_form ?? w.surface); }}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                    style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}
                  >
                    {w.base_form ?? w.surface}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              Start searching — type any Japanese word above
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="py-8 text-center text-sm text-red-500">{error}</p>
      )}

      {/* No results */}
      {searched && !loading && !error && results.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">
            No clips found for &ldquo;{committed}&rdquo;
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Try searching the base form, e.g.{" "}
            <button
              className="text-amber-600 underline"
              onClick={() => {
                const base = committed.replace(/[てでただってっていいき]$/, "る") || committed;
                setQuery(base);
                doSearch(base);
              }}
            >
              {committed}
            </button>
          </p>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <>
          <p className="mb-4 text-xs text-gray-400">
            {results.length} clip{results.length !== 1 ? "s" : ""} for &ldquo;{committed}&rdquo;
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <HcClipCard key={r.word_id} result={r} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load 20 more results"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
