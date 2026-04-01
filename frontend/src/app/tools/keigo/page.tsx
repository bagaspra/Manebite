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
import styles from "@/components/GlassUI.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

const GUEST_LIMIT = 3;
const LOCAL_HISTORY_KEY = "manebite_keigo_history";
const LOCAL_GUEST_COUNT_KEY = "manebite_keigo_guest_count";

const levelConfig: Record<string, { label: string; className: string }> = {
  teineigo: { label: "teineigo 丁寧語", className: "bg-blue-100/80 text-blue-700 border border-blue-200" },
  kenjougo: { label: "kenjougo 謙譲語", className: "bg-purple-100/80 text-purple-700 border border-purple-200" },
  sonkeigo: { label: "sonkeigo 尊敬語", className: "bg-emerald-100/80 text-emerald-700 border border-emerald-200" },
};

type InputMode = "en" | "ja";

function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-3/4 animate-pulse rounded bg-white/40" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-white/40" />
      <div className="mt-4 h-px bg-white/20" />
      <div className="h-3 w-full animate-pulse rounded bg-white/40" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-white/40" />
    </div>
  );
}

export default function KeigoPage() {
  const { t } = useLanguage();
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

  useEffect(() => {
    const count = parseInt(localStorage.getItem(LOCAL_GUEST_COUNT_KEY) ?? "0", 10);
    setGuestCount(count);
    const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (stored) {
      try { setLocalHistory(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    getKeigoHistory(userId).then(setDbHistory).catch(() => {});
  }, [userId]);

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
    if (!userId && guestCount >= GUEST_LIMIT) return;

    setIsLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const data = await translateKeigo({ text, input_mode: inputMode }, userId);
      setResult(data);

      if (userId) {
        getKeigoHistory(userId).then(setDbHistory).catch(() => {});
      } else {
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
          ? "Gemini API limit reached. Please wait a moment."
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
    setInputText(item.input_text || "");
    setInputMode(item.input_mode as InputMode);
    setResult({
      output_ja: item.output_ja,
      explanation: item.explanation ?? "",
      levels_used: item.levels_used,
      input_mode: item.input_mode,
    });
  }

  const isGuestBlocked = !userId && guestCount >= GUEST_LIMIT;
  const historyItems = userId ? dbHistory : localHistory;

  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.output_ja);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className={styles.page}>
      <div className={styles.mainSection} style={{ padding: 0, overflow: "hidden" }}>
        
        {/* Toolbar matching Shadowing Queue */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolIcon}>敬</div>
            <div>
              <div className={styles.toolTitle}>Keigo Translator</div>
              <div className={styles.toolSub}>Perfect your formal Japanese with AI-powered honorifics</div>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            {!userId && (
               <div className="flex items-center gap-4 px-4 py-2 bg-white/40 border border-white/60 rounded-full">
                 <span className="text-xs font-semibold text-gray-500">
                   {isGuestBlocked ? "Limit reached" : `${GUEST_LIMIT - guestCount} free translations left`}
                 </span>
                 <Link href="/login?callbackUrl=/tools/keigo" className="text-xs font-bold text-purple-600 hover:text-purple-800">
                   Log in
                 </Link>
               </div>
            )}
          </div>
        </div>

        {/* Two-Column Full Width Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/50">
          
          {/* Left Side: Input Area */}
          <div className="p-6 md:p-8 space-y-5 bg-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700 tracking-wide uppercase">Original phrase</h2>
              <div className={styles.tabs}>
                <button
                  onClick={() => setInputMode("en")}
                  className={`${styles.tab} ${inputMode === "en" ? styles.tabActive : ""}`}
                >
                  Indonesian / EN
                </button>
                <button
                  onClick={() => setInputMode("ja")}
                  className={`${styles.tab} ${inputMode === "ja" ? styles.tabActive : ""}`}
                >
                  日本語 (casual)
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                inputMode === "en"
                  ? "What would you like to say formally?\nExample: 'Can I go home now?' or 'Maaf telat.'"
                  : "日本語のカジュアルな文を入力…\n例: 'もう帰っていい？'"
              }
              disabled={isGuestBlocked}
              className={`${styles.urlInput} w-full resize-y !rounded-2xl !p-5 !text-lg !leading-relaxed shadow-inner placeholder-gray-400`}
              style={{
                 minHeight: "180px",
                 ...(inputMode === "ja" ? { fontFamily: "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif" } : {})
              }}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {inputText.trim().length < 3 && inputText.length > 0 ? "Type at least 3 characters" : "\u00a0"}
              </p>
              <button
                onClick={handleTranslate}
                disabled={isLoading || inputText.trim().length < 3 || isGuestBlocked}
                className="group flex items-center gap-2 rounded-xl border border-[#1A1A2E]/10 bg-[#1A1A2E] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  padding: "10px 20px",
                  transition: "transform 150ms ease-out, box-shadow 150ms ease-out, background-color 150ms ease-out",
                }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,26,46,0.2)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                onMouseDown={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = "scale(0.97) translateY(0)"; e.currentTarget.style.transition = "transform 50ms ease-out"; } }}
                onMouseUp={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.transition = "transform 150ms ease-out, box-shadow 150ms ease-out"; }}
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("keigo_translating")}
                  </>
                ) : (
                  <>
                    <span style={{ transition: "transform 200ms ease-out 20ms" }} className="group-hover:rotate-12">✦</span>
                    {t("keigo_translate")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Result & History Area */}
          <div className="p-6 md:p-8 space-y-6 bg-white/30 backdrop-blur-sm relative">
            
            {apiError && (
               <div className="p-4 bg-red-100/80 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                 {apiError}
               </div>
            )}

            {/* Active Result Banner */}
            {(isLoading || result) && (
              <div className="animate-fadeUp">
                <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase mb-3">Formal Translation</h3>
                <div className="bg-white/60 backdrop-blur-xl border border-white/90 shadow-xl shadow-purple-500/5 rounded-2xl p-6">
                  {isLoading ? (
                    <ResultSkeleton />
                  ) : result ? (
                    <>
                      <div className="mb-2 flex justify-between items-start">
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-100 px-2 py-0.5 rounded">Result</span>
                        <button onClick={handleCopy} className={`text-xs font-semibold transition-colors ${copied ? "text-emerald-500" : "text-gray-400 hover:text-gray-700"}`}>
                          {copied ? "✓ Copied!" : "Copy"}
                        </button>
                      </div>
                      
                      <p
                        className="text-2xl font-bold tracking-wide text-[#1A1A2E] leading-relaxed my-4"
                        style={{ fontFamily: "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif" }}
                      >
                        {result.output_ja}
                      </p>

                      {result.levels_used.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {result.levels_used.map((level) => {
                            const cfg = levelConfig[level] || { label: level, className: "bg-gray-100 text-gray-600 border border-gray-200" };
                            return (
                              <span key={level} className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${cfg.className}`}>
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {result.explanation && (
                        <>
                          <div className="my-5 h-px bg-black/5" />
                          <p className="text-sm leading-relaxed text-gray-600">{result.explanation}</p>
                        </>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* History List */}
            {historyItems.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-3 px-1">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t("keigo_recent")}</h3>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {historyItems.map((item, i) => {
                    const key = "id" in item ? item.id : i;
                    return (
                      <div
                        key={key as string}
                        className="group flex cursor-pointer items-center justify-between rounded-xl bg-white/40 border border-white/70 p-4 transition-all hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5"
                        onClick={() => loadFromHistory(item)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-gray-500 font-medium mb-1.5">{item.input_text}</p>
                          <p
                            className="truncate text-[15px] font-bold text-[#1A1A2E]"
                            style={{ fontFamily: "var(--font-noto-sans-jp), 'Noto Sans JP', sans-serif" }}
                          >
                            {item.output_ja}
                          </p>
                        </div>
                        {"id" in item && userId && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteHistory((item as KeigoHistoryItem).id); }}
                            className="ml-4 h-8 w-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all shadow-sm"
                            aria-label="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
