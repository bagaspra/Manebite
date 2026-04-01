"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { gpGetPackDetail, type GoiPackDetail, type GoiWord } from "@/lib/api";
import ExampleCarousel from "@/components/ExampleCarousel";
import FuriganaToggle from "@/components/FuriganaToggle";
import styles from "@/components/GlassUI.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

const JLPT_COLORS: Record<number, string> = {
  5: "bg-emerald-100/70 text-emerald-700 border-emerald-200/50",
  4: "bg-teal-100/70 text-teal-700 border-teal-200/50",
  3: "bg-sky-100/70 text-sky-700 border-sky-200/50",
  2: "bg-amber-100/70 text-amber-700 border-amber-200/50",
  1: "bg-red-100/70 text-red-700 border-red-200/50",
};

function JlptBadge({ level }: { level: number }) {
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${JLPT_COLORS[level] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      N{level}
    </span>
  );
}

function WordCard({ word, lang }: { word: GoiWord; lang: "en" | "id" }) {
  const [showFurigana, setShowFurigana] = useState(false);
  const meaning = lang === "en" ? word.meaning_en : word.meaning_id;
  const hasRuby = Array.isArray(word.examples_ja_ruby) && word.examples_ja_ruby.some(Boolean);

  return (
    <div className="rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 p-6 transition-all hover:bg-white/70 hover:shadow-md shadow-sm">
      {/* Word header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span
            className="text-3xl font-bold text-[#1A1A2E]"
            style={{ fontFamily: "var(--font-noto-serif-jp, serif)" }}
          >
            {word.surface}
          </span>
          <span className="ml-3 text-sm text-gray-400 font-medium">（{word.reading}）</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasRuby && (
            <FuriganaToggle isActive={showFurigana} onToggle={() => setShowFurigana((v) => !v)} />
          )}
          <JlptBadge level={word.jlpt_level} />
        </div>
      </div>

      {/* Meaning */}
      <p className="mb-4 text-sm text-gray-600 leading-relaxed bg-white/40 rounded-xl p-3 border border-white/60">
        {meaning}
      </p>

      {/* Examples */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">例文 Examples</p>
        <ExampleCarousel
          examplesJa={word.examples_ja}
          examplesJaRuby={word.examples_ja_ruby}
          examplesEn={word.examples_en}
          examplesId={word.examples_id}
          lang={lang}
          showFurigana={showFurigana}
        />
      </div>
    </div>
  );
}

export default function PackDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const packId = Number(params.packId);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [detail, setDetail] = useState<GoiPackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "id">("id");

  useEffect(() => {
    gpGetPackDetail(packId, userId)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [packId, userId]);

  const pack = detail?.pack;
  const words = detail?.words ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.mainSection} style={{ padding: 0 }}>
        
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolIcon} style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>📚</div>
            <div>
              <div className={styles.toolTitle}>{pack?.name_ja ?? "Loading..."}</div>
              <div className={styles.toolSub}>{pack ? `${pack.name_en} · ${words.length} ${t("gp_words")}` : ""}</div>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            {/* Breadcrumb tabs */}
            <div className={styles.tabs}>
              <Link href="/tools/goipack" className={styles.tab}>GoiPack</Link>
              {pack && <Link href={`/tools/goipack/${pack.category_id}`} className={styles.tab}>{t("gp_category")}</Link>}
              <div className={`${styles.tab} ${styles.tabActive}`}>{pack?.name_ja ?? "..."}</div>
            </div>

            {/* Language toggle */}
            <div className={styles.tabs} style={{ marginLeft: "8px" }}>
              <button
                onClick={() => setLang("id")}
                className={`${styles.tab} ${lang === "id" ? styles.tabActive : ""}`}
              >
                ID
              </button>
              <button
                onClick={() => setLang("en")}
                className={`${styles.tab} ${lang === "en" ? styles.tabActive : ""}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 min-h-[50vh]">
          
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl bg-white/30 border border-white/50 p-8 animate-pulse">
                  <div className="h-8 w-24 rounded bg-white/50 mb-3" />
                  <div className="h-4 w-2/3 rounded bg-white/40 mb-2" />
                  <div className="h-3 w-1/2 rounded bg-white/30" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100/80 border border-red-200 text-red-600 rounded-xl text-center text-sm font-semibold">
              {error}
            </div>
          )}

          {!loading && pack && (
            <>
              {/* Pack description */}
              {pack.description && (
                <div className="mb-8 p-4 rounded-2xl bg-white/30 border border-white/50 backdrop-blur-md text-sm text-gray-500 leading-relaxed">
                  {pack.description}
                </div>
              )}

              {words.length === 0 ? (
                <div className="py-20 text-center bg-white/20 rounded-2xl border border-dashed border-white/50">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm font-bold text-gray-500">{t("gp_no_words")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {words.map((word, i) => (
                    <div key={word.id} className="animate-fadeUp" style={{ animationDelay: `${i * 0.04}s` }}>
                      <WordCard word={word} lang={lang} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
