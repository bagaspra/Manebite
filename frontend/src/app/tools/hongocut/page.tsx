"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  hcSearch,
  hcSearchSuggestions,
  hcGetPopularWords,
  type HcSearchResult,
  type HcSuggestion,
} from "@/lib/api";
import styles from "@/components/GlassUI.module.css";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

function highlightWord(text: string, surface: string): string {
  if (!surface) return text;
  return text.replace(new RegExp(surface, "g"), `<mark class="bg-amber-200/50 text-amber-900 rounded font-bold px-1">${surface}</mark>`);
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
    <div className={styles.vcard}>
      {/* Video area */}
      <div className={styles.vcardThumb} style={{ overflow: "hidden", background: "none" }}>
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
            className="group absolute inset-0 flex items-center justify-center cursor-pointer"
            aria-label="Play clip"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${result.youtube_id}/mqdefault.jpg`}
              alt={result.title ?? ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className={styles.playOverlay}>
               <div className={styles.playBtn}>▶</div>
            </div>
          </button>
        )}
      </div>

      <div className={styles.vbody} style={{ gap: "8px" }}>
        <p
          className="text-[14px] leading-relaxed text-[#1A1A2E] font-medium"
          style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}
          dangerouslySetInnerHTML={{ __html: highlightWord(result.text_ja, result.surface) }}
        />
        {result.text_romaji && (
          <p className="text-xs text-gray-500 font-medium">{result.text_romaji}</p>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-2">
          {result.channel && (
             <div className="text-[10px] font-bold text-gray-400 truncate max-w-[70%] bg-white/50 px-2 py-1 rounded">
                📺 {result.channel}
             </div>
          )}
          <div className="text-[10px] font-bold text-gray-400 bg-white/50 px-2 py-1 rounded">
            ⏱ {formatTime(result.start_time)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HongoCutPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
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

  useEffect(() => {
    hcGetPopularWords().then(setPopular).catch(() => {});
  }, []);

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
    } catch { /* silently ignore */ } 
    finally { setLoadingMore(false); }
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
    <div className={styles.page}>
      <div className={styles.mainSection} style={{ padding: 0 }}>
        
        {/* Toolbar matching Shadowing Queue */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolIcon} style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>✂</div>
            <div>
              <div className={styles.toolTitle}>HongoCut</div>
              <div className={styles.toolSub}>Learn context by searching exact Japanese words from native speakers</div>
            </div>
          </div>
          <div className={styles.toolbarRight}>
             {/* decorative spacer if needed */}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-10 space-y-8 min-h-[60vh]">
          
          {/* Main Search Input */}
          <div className="max-w-2xl mx-auto relative z-20">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="例: 買う、食べる、仕事..."
                  className={`${styles.urlInput} w-full !px-6 !py-4 !text-lg !rounded-2xl shadow-inner`}
                  style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-[110%] mt-2 overflow-hidden rounded-xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl z-30 divide-y divide-white/50">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-white/90 transition-colors"
                          onMouseDown={() => pickSuggestion(s)}
                        >
                          <span className="font-bold text-[#1A1A2E] text-base" style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}>
                            {s.surface}
                          </span>
                          {s.reading && s.reading !== s.surface && (
                            <span className="text-gray-500 font-medium text-sm">{s.reading}</span>
                          )}
                          {s.base_form && s.base_form !== s.surface && (
                            <span className="ml-auto text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">{s.base_form}</span>
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
                className="group flex-shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-[#1A1A2E] text-white font-bold text-[14px] px-8 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
                }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,26,46,0.15)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                onMouseDown={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = "scale(0.96) translateY(0)"; e.currentTarget.style.transition = "transform 50ms ease-out"; } }}
                onMouseUp={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.transition = "transform 150ms ease-out, box-shadow 150ms ease-out"; }}
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `🔍 ${t("hc_search")}`}
              </button>
            </div>
          </div>

          {/* INITIAL STATE: Popular words */}
          {!searched && !loading && (
            <div className="max-w-2xl mx-auto text-center mt-12 animate-fadeUp">
              {popular.length > 0 ? (
                <>
                  <p className="mb-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase">{t("hc_popular")}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {popular.map((w, i) => (
                      <button
                        key={i}
                        onClick={() => { setQuery(w.base_form ?? w.surface); doSearch(w.base_form ?? w.surface); }}
                        className="rounded-xl border border-white/60 bg-white/40 backdrop-blur-md px-4 py-2 text-sm font-bold text-gray-600 transition-all hover:bg-amber-100/50 hover:text-amber-700 hover:border-amber-300 hover:scale-[1.03] shadow-sm"
                        style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}
                      >
                        {w.base_form ?? w.surface}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 rounded-2xl bg-white/30 border border-white/50 border-dashed">
                   <div className="text-3xl mb-3">🔤</div>
                   <p className="text-sm font-bold text-gray-500">Type a Japanese word, verb, or expression to find video examples.</p>
                </div>
              )}
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-amber-500">
              <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold tracking-widest uppercase">Hunting clips...</p>
            </div>
          )}

          {/* ERROR */}
          {error && (
             <div className="max-w-xl mx-auto p-4 bg-red-100/80 border border-red-200 text-red-600 rounded-xl text-center text-sm font-semibold">
               {error}
             </div>
          )}

          {/* EMPTY RESULTS */}
          {searched && !loading && !error && results.length === 0 && (
            <div className="max-w-xl mx-auto py-16 text-center bg-white/30 rounded-3xl border border-white/50 backdrop-blur-md">
              <div className="text-4xl mb-4">🤷‍♂️</div>
              <p className="text-base font-bold text-gray-700 mb-2">
                {t("hc_no_results")} <span className="text-amber-600">&ldquo;{committed}&rdquo;</span>
              </p>
              <p className="text-sm text-gray-500">
                Try searching the dictionary base form instead. For example: <br/>
                <button
                  className="mt-3 inline-block font-bold text-white bg-amber-500/90 rounded-full px-4 py-1 hover:bg-amber-600 transition-colors shadow-sm"
                  onClick={() => {
                    const base = committed.replace(/[てでただってっていいき]$/, "る") || committed;
                    setQuery(base);
                    doSearch(base);
                  }}
                >
                  Search for "{committed.replace(/[てでただってっていいき]$/, "る") || committed}" →
                </button>
              </p>
            </div>
          )}

          {/* RESULTS GRID */}
          {results.length > 0 && (
            <div className="animate-fadeUp">
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <span className="text-amber-600">{results.length}</span> {t("hc_clips")} &ldquo;{committed}&rdquo;
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r, i) => (
                  <div key={r.word_id + i} style={{ animationDelay: `${i * 0.05}s` }} className="animate-fadeUp">
                    <HcClipCard result={r} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="group inline-flex items-center gap-2 rounded-xl bg-white/40 border border-white/60 backdrop-blur-md px-6 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      transition: "transform 150ms ease-out, box-shadow 150ms ease-out, background-color 150ms ease-out",
                    }}
                    onMouseDown={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = "scale(0.97)"; } }}
                    onMouseUp={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                  >
                    {loadingMore ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : `⬇ ${t("hc_load_more")}`}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
