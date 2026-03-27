"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSessionProgress, updateProgress, type Progress, type VideoDetail } from "@/lib/api";
import { useJishoLookup } from "@/hooks/useJishoLookup";
import { SelectableSentence } from "./SelectableSentence";
import WordPopup from "./WordPopup";

// ─── Dark-theme tokens (scoped to session page) ───────────────────────────────
const C = {
  bg:      "#111113",
  surface: "#1A1A1C",
  panel:   "#161618",
  border:  "#2A2A2E",
  text:    "#F0F0F0",
  muted:   "#888890",
  accent:  "#C41E3A",
  success: "#4ADE80",
  activeRow: "rgba(196,30,58,0.08)",
} as const;

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconPrev() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" />
    </svg>
  );
}
function IconNext() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

// ─── Toggle button ────────────────────────────────────────────────────────────
function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded px-3 py-1 text-xs font-semibold transition-all"
      style={{
        background: active ? C.accent : "transparent",
        color: active ? "#fff" : C.muted,
        border: `1px solid ${active ? C.accent : C.border}`,
      }}
    >
      {children}
    </button>
  );
}

// ─── Finish modal ─────────────────────────────────────────────────────────────
function FinishModal({ completedCount, total, onPracticeAgain, videoId }: {
  completedCount: number; total: number; onPracticeAgain: () => void; videoId: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-xl p-8 text-center shadow-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="mb-4 text-5xl">🎉</div>
        <h2 className="mb-2 text-2xl font-bold" style={{ color: C.text }}>Session Complete!</h2>
        <p className="mb-6 text-sm" style={{ color: C.muted }}>
          You shadowed <strong style={{ color: C.text }}>{completedCount}</strong> of <strong style={{ color: C.text }}>{total}</strong> sentences.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onPracticeAgain} className="w-full rounded py-2.5 text-sm font-semibold text-white"
            style={{ background: C.accent }}>
            Practice Again
          </button>
          <Link href="/dashboard" className="block w-full rounded border py-2.5 text-center text-sm font-semibold transition-colors"
            style={{ borderColor: C.border, color: C.text }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg"
      style={{ background: "rgba(0,0,0,0.85)" }}>
      {message}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Props = { video: VideoDetail; userId?: string };

export default function ShadowingSession({ video, userId }: Props) {
  const sentences = video.sentences;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [sentenceVisible, setSentenceVisible] = useState(true);
  const [showFinish, setShowFinish] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<number, Progress>>({});
  const [completedCount, setCompletedCount] = useState(0);

  // Word lookup state
  const { result: jishoResult, loading: jishoLoading, lookup } = useJishoLookup();
  const [popupWord, setPopupWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const ytPlayer      = useRef<YT.Player | null>(null);
  const loopInterval  = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const isLoopingRef    = useRef(isLooping);
  const replayCount     = useRef(0);
  const activeNavRef    = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  useEffect(() => { activeNavRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [currentIndex]);

  // Close popup when sentence changes
  useEffect(() => {
    setPopupWord(null);
    setPopupPosition(null);
  }, [currentIndex]);

  // Load progress
  useEffect(() => {
    if (!userId) return;
    getSessionProgress(video.id, userId)
      .then((sp) => {
        const map: Record<number, Progress> = {};
        for (const p of sp.sentences) map[p.sentence_id] = p;
        setProgressMap(map);
        setCompletedCount(sp.completed_count);
        if (sp.last_sentence_id != null) {
          const idx = sentences.findIndex((s) => s.id === sp.last_sentence_id);
          if (idx > 0) { setCurrentIndex(idx); showToast(`Resuming from sentence ${idx + 1}`); }
        }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, video.id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // YouTube init
  const initPlayer = useCallback(() => {
    ytPlayer.current = new window.YT.Player("youtube-player", {
      videoId: video.youtube_id,
      playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
      events: {
        onReady: () => setPlayerReady(true),
        onStateChange: (e) => setIsPlaying(e.data === YT.PlayerState.PLAYING),
      },
    });
  }, [video.youtube_id]);

  useEffect(() => {
    if (window.YT && window.YT.Player) { initPlayer(); }
    else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }
    return () => { if (loopInterval.current) clearInterval(loopInterval.current); ytPlayer.current?.destroy(); };
  }, [initPlayer]);

  // Loop
  useEffect(() => {
    if (loopInterval.current) clearInterval(loopInterval.current);
    if (!playerReady || !isLooping) return;
    loopInterval.current = setInterval(() => {
      const player = ytPlayer.current;
      const sentence = sentences[currentIndexRef.current];
      if (!player || !sentence) return;
      if (player.getCurrentTime() >= sentence.end_time) {
        replayCount.current += 1;
        player.seekTo(sentence.start_time, true);
        player.playVideo();
        if (userId && replayCount.current % 3 === 0)
          updateProgress(video.id, { sentence_id: sentence.id, replays: replayCount.current, completed: false }, userId).catch(() => {});
      }
    }, 250);
    return () => { if (loopInterval.current) clearInterval(loopInterval.current); };
  }, [currentIndex, isLooping, playerReady, sentences, userId, video.id]);

  const playCurrent = useCallback((index: number) => {
    const player = ytPlayer.current;
    if (!player || !playerReady) return;
    const s = sentences[index];
    if (!s) return;
    player.seekTo(s.start_time, true);
    player.playVideo();
  }, [playerReady, sentences]);

  const saveProgress = useCallback((index: number) => {
    if (!userId) return;
    const s = sentences[index];
    if (!s) return;
    updateProgress(video.id, { sentence_id: s.id, replays: replayCount.current, completed: true }, userId)
      .then((p) => {
        setProgressMap((prev) => ({ ...prev, [s.id]: p }));
        setCompletedCount((c) => c + (progressMap[s.id]?.completed ? 0 : 1));
      }).catch(() => {});
    replayCount.current = 0;
  }, [userId, sentences, video.id, progressMap]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= sentences.length - 1) return prev;
      saveProgress(prev);
      const next = prev + 1;
      setSentenceVisible(false);
      replayCount.current = 0;
      setTimeout(() => { setSentenceVisible(true); playCurrent(next); }, 150);
      return next;
    });
  }, [sentences.length, playCurrent, saveProgress]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      setSentenceVisible(false);
      replayCount.current = 0;
      setTimeout(() => { setSentenceVisible(true); playCurrent(next); }, 150);
      return next;
    });
  }, [playCurrent]);

  const togglePlay = useCallback(() => {
    const player = ytPlayer.current;
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else { if (!playerReady) return; playCurrent(currentIndexRef.current); }
  }, [isPlaying, playerReady, playCurrent]);

  function handleFinish() { saveProgress(currentIndex); setShowFinish(true); }
  function handlePracticeAgain() {
    setShowFinish(false); setCurrentIndex(0); replayCount.current = 0;
    setSentenceVisible(false);
    setTimeout(() => { setSentenceVisible(true); playCurrent(0); }, 150);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ": e.preventDefault(); setPopupWord(null); togglePlay(); break;
        case "n": case "ArrowRight": setPopupWord(null); goToNext(); break;
        case "p": case "ArrowLeft": setPopupWord(null); goToPrev(); break;
        case "l": setIsLooping((v) => !v); break;
        case "r": setShowRomaji((v) => !v); break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, goToNext, goToPrev]);

  const sentence = sentences[currentIndex];
  const isLast = currentIndex === sentences.length - 1;
  const progressPct = sentences.length > 1
    ? userId ? (completedCount / sentences.length) * 100 : (currentIndex / (sentences.length - 1)) * 100
    : 100;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showFinish && <FinishModal completedCount={completedCount} total={sentences.length} onPracticeAgain={handlePracticeAgain} videoId={video.id} />}
      {toast && <Toast message={toast} />}
      {popupWord && (
        <WordPopup
          word={popupWord}
          reading={jishoResult?.reading ?? ''}
          meanings={jishoResult?.meanings ?? []}
          partOfSpeech={jishoResult?.partOfSpeech ?? ''}
          loading={jishoLoading}
          position={popupPosition}
          onClose={() => setPopupWord(null)}
        />
      )}

      <style>{`
        .sq-root { height: calc(100vh - 64px); overflow: hidden; display: flex; flex-direction: column; }
        .sq-body  { display: flex; flex: 1; overflow: hidden; }

        /* Video: capped at 55vh so navigator always has room */
        .sq-video-wrap {
          flex-shrink: 0;
          width: 100%;
          max-height: 55vh;
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        .sq-video-wrap[aria-hidden="true"] {
          max-height: 0;
          opacity: 0;
        }
        .sq-video-wrap iframe,
        .sq-video-wrap > div {
          width: 100%;
          aspect-ratio: 16/9;
          max-height: 55vh;
          display: block;
        }

        /* Navigator wrapper: gradient fade at bottom */
        .sq-nav-wrap {
          position: relative;
          flex: 1;
          overflow: hidden;
          min-height: 120px;
        }
        .sq-nav-wrap::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 36px;
          background: linear-gradient(transparent, ${C.bg});
          pointer-events: none;
          z-index: 1;
        }
        .sq-nav {
          height: 100%;
          overflow-y: auto;
        }

        @media (max-width: 767px) {
          .sq-root  { height: auto; overflow: visible; }
          .sq-body  { flex-direction: column; overflow: visible; }
          .sq-right { width: 100% !important; border-left: none !important; border-top: 1px solid ${C.border}; }
          .sq-nav   { max-height: 280px; }
          .sq-video-wrap { max-height: 40vh; }
          .sq-video-wrap > div { max-height: 40vh; }
        }
      `}</style>

      <div className="sq-root" style={{ background: C.bg }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          {/* Row 1: back + title + toggles */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Link
              href={`/videos/${video.id}`}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-sm transition-opacity hover:opacity-70"
              style={{ background: C.panel, color: C.text, border: `1px solid ${C.border}` }}
              aria-label="Back"
            >
              ←
            </Link>
            <span
              className="min-w-0 flex-1 truncate text-sm font-semibold"
              style={{ color: C.text }}
              title={video.title ?? video.youtube_id}
            >
              {video.title ?? video.youtube_id}
            </span>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <ToggleBtn active={showVideo} onClick={() => setShowVideo((v) => !v)}>
                {showVideo ? "Video" : "Audio"}
              </ToggleBtn>
              <ToggleBtn active={isLooping} onClick={() => setIsLooping((v) => !v)}>Loop</ToggleBtn>
              <ToggleBtn active={showRomaji} onClick={() => setShowRomaji((v) => !v)}>Rōmaji</ToggleBtn>
            </div>
          </div>
          {/* Row 2: progress bar */}
          <div className="flex items-center gap-3 px-4 pb-2.5">
            <span className="flex-shrink-0 text-xs tabular-nums font-medium" style={{ color: C.muted }}>
              {currentIndex + 1} / {sentences.length}
            </span>
            <div className="flex-1 h-1.5 overflow-hidden rounded-full" style={{ background: C.border }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: C.accent }} />
            </div>
            {userId && (
              <span className="flex-shrink-0 text-xs font-medium" style={{ color: C.muted }}>
                {completedCount} completed
              </span>
            )}
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div className="sq-body">

          {/* LEFT PANEL: video + navigator */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* YouTube — always in DOM; CSS class hides it in audio mode (audio keeps playing) */}
            <div className="sq-video-wrap" aria-hidden={!showVideo ? "true" : undefined}>
              <div style={{ position: "relative" }}>
                <div id="youtube-player" style={{ width: "100%", aspectRatio: "16/9", display: "block" }} />
              </div>
            </div>

            {/* Sentence navigator — gradient fade wrapper + scrollable inner */}
            <div className="sq-nav-wrap" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="sq-nav">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                All Sentences ({sentences.length})
              </div>
              {sentences.map((s, i) => {
                const isCompleted = progressMap[s.id]?.completed === true;
                const isActive = i === currentIndex;
                return (
                  <button
                    key={s.id}
                    ref={isActive ? activeNavRef : null}
                    onClick={() => {
                      setSentenceVisible(false);
                      replayCount.current = 0;
                      setTimeout(() => { setSentenceVisible(true); setCurrentIndex(i); playCurrent(i); }, 150);
                    }}
                    className="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:opacity-80"
                    style={{
                      borderColor: C.border,
                      background: isActive ? C.activeRow : "transparent",
                      borderLeft: `3px solid ${isActive ? C.accent : "transparent"}`,
                    }}
                  >
                    <span
                      className="w-5 flex-shrink-0 text-center font-mono text-xs"
                      style={{ color: C.muted }}
                    >
                      {s.sequence_no ?? i + 1}
                    </span>
                    <span
                      className="flex-1 truncate"
                      style={{ color: isActive ? C.text : "#B0B0B8", fontWeight: isActive ? 600 : 400 }}
                    >
                      {s.text_ja}
                    </span>
                    {isCompleted && (
                      <span className="flex-shrink-0 text-xs font-bold" style={{ color: C.success }}>✓</span>
                    )}
                  </button>
                );
              })}
              </div>{/* end sq-nav */}
            </div>{/* end sq-nav-wrap */}
          </div>{/* end left panel */}

          {/* RIGHT PANEL */}
          <div
            className="sq-right flex flex-shrink-0 flex-col"
            style={{
              width: 320,
              borderLeft: `1px solid ${C.border}`,
              background: C.surface,
            }}
          >
            {/* Sentence card — vertically centered, takes available space */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem 1.5rem",
                textAlign: "center",
                opacity: sentenceVisible ? 1 : 0,
                transform: sentenceVisible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
            >
              {sentence ? (
                <>
                  <p
                    className="text-2xl font-bold leading-relaxed"
                    style={{ color: C.text, fontFamily: "'Noto Serif JP', serif" }}
                  >
                    <SelectableSentence
                      text={sentence.text_ja}
                      onWordSelect={(word, rect) => {
                        setPopupWord(word);
                        setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top });
                        lookup(word);
                      }}
                    />
                  </p>
                  <p style={{ fontSize: '11px', opacity: 0.4, marginTop: '0.5rem', color: C.muted }}>
                    Select a word to look it up
                  </p>
                  <div
                    style={{
                      maxHeight: showRomaji ? "5rem" : 0,
                      overflow: "hidden",
                      opacity: showRomaji ? 1 : 0,
                      transition: "max-height 0.25s ease, opacity 0.25s ease",
                      marginTop: showRomaji ? "1rem" : 0,
                    }}
                  >
                    <p className="text-sm" style={{ color: C.muted }}>{sentence.text_romaji ?? ""}</p>
                  </div>
                </>
              ) : (
                <p style={{ color: C.muted }}>No sentences available.</p>
              )}
            </div>

            {/* Playback controls */}
            <div
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${C.border}`,
                padding: "1.25rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div className="flex items-center gap-5">
                {/* Prev */}
                <button
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-opacity disabled:opacity-25 hover:opacity-70"
                  style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text }}
                  aria-label="Previous"
                >
                  <IconPrev />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  disabled={!playerReady}
                  className="flex h-14 w-14 items-center justify-center rounded-full text-white transition-all disabled:opacity-40 hover:brightness-110 active:scale-95"
                  style={{ background: C.accent }}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <IconPause /> : <IconPlay />}
                </button>

                {/* Next / Finish */}
                {isLast ? (
                  <button
                    onClick={handleFinish}
                    className="flex h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold"
                    style={{ borderColor: C.accent, color: C.accent, background: C.panel, minWidth: "2.75rem" }}
                  >
                    ✓ Done
                  </button>
                ) : (
                  <button
                    onClick={goToNext}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text }}
                    aria-label="Next"
                  >
                    <IconNext />
                  </button>
                )}
              </div>

              <p className="text-xs" style={{ color: C.muted }}>
                Space · N next · P prev · L loop · R rōmaji
              </p>
            </div>

            {/* Session info */}
            <div
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${C.border}`,
                padding: "0.875rem 1rem",
              }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                Now Shadowing
              </p>
              <p className="text-sm font-bold" style={{ color: C.text }}>
                Sentence {currentIndex + 1} of {sentences.length}
              </p>
              {userId && (
                <p className="mt-0.5 text-xs font-semibold" style={{ color: C.accent }}>
                  {completedCount} / {sentences.length} completed
                </p>
              )}
            </div>
          </div>

        </div>{/* end sq-body */}
      </div>{/* end sq-root */}
    </>
  );
}
