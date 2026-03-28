"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  translateKeigo,
  getKeigoHistory,
  deleteKeigoHistoryItem,
  importKeigoHistory,
  type KeigoResult,
  type KeigoHistoryItem,
  type LocalKeigoHistoryItem,
} from "@/lib/api";

const GUEST_LIMIT = 3;
const LOCAL_HISTORY_KEY = "manebite_keigo_history";
const LOCAL_GUEST_COUNT_KEY = "manebite_keigo_guest_count";

const levelConfig: Record<string, { label: string; className: string }> = {
  teineigo: { label: "teineigo 丁寧語", className: "bg-sky-50 text-sky-700 border border-sky-200" },
  kenjougo: { label: "kenjougo 謙譲語", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  sonkeigo: { label: "sonkeigo 尊敬語", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

type InputMode = "en" | "ja";

function ResultSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-px bg-gray-100" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

export default function KeigoPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [inputMode, setInputMode] = useState<InputMode>("en");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KeigoResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [dbHistory, setDbHistory] = useState<KeigoHistoryItem[]>([]);
  const [localHistory, setLocalHistory] = useState<LocalKeigoHistoryItem[]>([]);
  const [guestCount, setGuestCount] = useState(0);

  const didMerge = useRef(false);

  // Load initial state from localStorage (client-side only)
  useEffect(() => {
    const count = parseInt(localStorage.getItem(LOCAL_GUEST_COUNT_KEY) ?? "0", 10);
    setGuestCount(count);
    const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (stored) {
      try { setLocalHistory(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  // Load DB history when user logs in
  useEffect(() => {
    if (!userId) return;
    getKeigoHistory(userId).then(setDbHistory).catch(() => {});
  }, [userId]);

  // Merge localStorage history into DB on first login
  useEffect(() => {
    if (!userId || didMerge.current) return;
    const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!stored) return;
    let items: LocalKeigoHistoryItem[] = [];
    try { items = JSON.parse(stored); } catch { return; }
    if (items.length === 0) return;

    didMerge.current = true;
    importKeigoHistory(items, userId)
      .then(() => {
        localStorage.removeItem(LOCAL_HISTORY_KEY);
        localStorage.removeItem(LOCAL_GUEST_COUNT_KEY);
        setLocalHistory([]);
        setGuestCount(0);
        return getKeigoHistory(userId);
      })
      .then(setDbHistory)
      .catch(() => { didMerge.current = false; });
  }, [userId]);

  async function handleTranslate() {
    const text = inputText.trim();
    if (text.length < 3) return;

    // Guest limit check
    if (!userId && guestCount >= GUEST_LIMIT) return;

    setIsLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const data = await translateKeigo({ text, input_mode: inputMode }, userId);
      setResult(data);

      if (userId) {
        // Reload DB history after successful translation
        getKeigoHistory(userId).then(setDbHistory).catch(() => {});
      } else {
        // Save to localStorage for guests
        const newCount = guestCount + 1;
        setGuestCount(newCount);
        localStorage.setItem(LOCAL_GUEST_COUNT_KEY, String(newCount));

        const item: LocalKeigoHistoryItem = {
          input_text: text,
          input_mode: inputMode,
          output_ja: data.output_ja,
          explanation: data.explanation,
          levels_used: data.levels_used,
        };
        const updated = [item, ...localHistory].slice(0, 10);
        setLocalHistory(updated);
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setApiError(
        msg.includes("quota") || msg.includes("429")
          ? "Gemini API quota exceeded. Please wait a moment and try again."
          : "Translation failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteHistory(id: number) {
    if (!userId) return;
    try {
      await deleteKeigoHistoryItem(id, userId);
      setDbHistory((prev) => prev.filter((h) => h.id !== id));
    } catch { /* ignore */ }
  }

  function loadFromHistory(item: KeigoHistoryItem | LocalKeigoHistoryItem) {
    setInputText(item.input_text);
    setInputMode(item.input_mode as InputMode);
    setResult({
      output_ja: item.output_ja,
      explanation: item.explanation ?? "",
      levels_used: item.levels_used,
      input_mode: item.input_mode,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isGuestBlocked = !userId && guestCount >= GUEST_LIMIT;
  const historyItems = userId ? dbHistory : localHistory;

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      {/* Mode toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setInputMode("en")}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            inputMode === "en"
              ? "bg-violet-600 text-white"
              : "border border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          English / Indonesian
        </button>
        <button
          onClick={() => setInputMode("ja")}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            inputMode === "ja"
              ? "bg-violet-600 text-white"
              : "border border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          日本語 (casual)
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={
          inputMode === "en"
            ? "Type in English or Indonesian…"
            : "日本語のカジュアルな文を入力…"
        }
        rows={3}
        disabled={isGuestBlocked}
        className="w-full resize-y rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
        style={inputMode === "ja" ? { fontFamily: "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif" } : {}}
      />

      {/* Translate button */}
      <button
        onClick={handleTranslate}
        disabled={isLoading || inputText.trim().length < 3 || isGuestBlocked}
        className="mt-3 w-full rounded-md bg-gray-900 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? "Translating…" : "Translate →"}
      </button>

      {/* Guest limit warning */}
      {!userId && guestCount > 0 && guestCount < GUEST_LIMIT && (
        <p className="mt-2 text-center text-xs text-gray-400">
          {GUEST_LIMIT - guestCount} free translation{GUEST_LIMIT - guestCount !== 1 ? "s" : ""} remaining.{" "}
          <Link href="/login?callbackUrl=/tools/keigo" className="text-violet-600 hover:underline">
            Log in
          </Link>{" "}
          for unlimited access.
        </p>
      )}

      {/* Guest blocked */}
      {isGuestBlocked && (
        <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50 px-4 py-4 text-center">
          <p className="text-sm font-medium text-violet-800">You&apos;ve used your 3 free translations.</p>
          <p className="mt-1 text-xs text-violet-600">Log in to continue with unlimited access.</p>
          <Link
            href="/login?callbackUrl=/tools/keigo"
            className="mt-3 inline-block rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700"
          >
            Log in →
          </Link>
        </div>
      )}

      {/* API error */}
      {apiError && (
        <p className="mt-3 text-sm text-red-500">{apiError}</p>
      )}

      {/* Result */}
      {(isLoading || result) && (
        <>
          <div className="my-6 h-px bg-gray-100" />
          <div className="rounded-lg border border-gray-100 p-5">
            {isLoading ? (
              <ResultSkeleton />
            ) : result ? (
              <>
                <p
                  className="text-lg font-medium tracking-wide text-gray-900"
                  style={{ fontFamily: "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif" }}
                >
                  {result.output_ja}
                </p>

                {result.levels_used.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.levels_used.map((level) => {
                      const cfg = levelConfig[level] ?? {
                        label: level,
                        className: "bg-gray-100 text-gray-600 border border-gray-200",
                      };
                      return (
                        <span key={level} className={`rounded-full px-2.5 py-0.5 text-xs ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {result.explanation && (
                  <>
                    <div className="my-4 h-px bg-gray-100" />
                    <p className="text-sm leading-relaxed text-gray-600">{result.explanation}</p>
                  </>
                )}
              </>
            ) : null}
          </div>
        </>
      )}

      {/* History */}
      {historyItems.length > 0 && (
        <section className="mt-10">
          <p className="mb-3 text-xs tracking-widest text-gray-400">RECENT TRANSLATIONS</p>
          <div className="space-y-2">
            {historyItems.map((item, i) => {
              const key = "id" in item ? item.id : i;
              return (
                <div
                  key={key as string}
                  className="group flex cursor-pointer items-start justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
                  onClick={() => loadFromHistory(item)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-500">{item.input_text}</p>
                    <p
                      className="mt-0.5 text-sm font-medium text-gray-900"
                      style={{ fontFamily: "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif" }}
                    >
                      {item.output_ja}
                    </p>
                  </div>
                  {"id" in item && userId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteHistory((item as KeigoHistoryItem).id); }}
                      className="ml-3 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
