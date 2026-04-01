"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { gpGetCategories, gpGetPacksInCategory, type GoiCategory, type GoiPack } from "@/lib/api";
import styles from "@/components/GlassUI.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CategoryPacksPage() {
  const { t } = useLanguage();
  const params = useParams();
  const categoryId = Number(params.categoryId);

  const [category, setCategory] = useState<GoiCategory | null>(null);
  const [packs, setPacks] = useState<GoiPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cats, packList] = await Promise.all([
          gpGetCategories(),
          gpGetPacksInCategory(categoryId),
        ]);
        setCategory(cats.find((c) => c.id === categoryId) ?? null);
        setPacks(packList);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId]);

  return (
    <div className={styles.page}>
      <div className={styles.mainSection} style={{ padding: 0 }}>
        
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolIcon} style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>
              {category?.icon ?? "📦"}
            </div>
            <div>
              <div className={styles.toolTitle}>{category ? category.name_ja : "Loading..."}</div>
              <div className={styles.toolSub}>{category?.name_en ?? ""}</div>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            {/* Breadcrumb pills */}
            <div className={styles.tabs}>
              <Link href="/tools/goipack" className={styles.tab}>← All Categories</Link>
              <div className={`${styles.tab} ${styles.tabActive}`}>
                {category ? `${category.icon} ${category.name_ja}` : "..."}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 min-h-[50vh]">

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl bg-white/30 border border-white/50 p-6 animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-white/50" />
                    <div className="h-3 w-1/4 rounded bg-white/40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100/80 border border-red-200 text-red-600 rounded-xl text-center text-sm font-semibold">
              {error}
            </div>
          )}

          {!loading && !error && packs.length === 0 && (
            <div className="py-20 text-center bg-white/20 rounded-2xl border border-dashed border-white/50">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-bold text-gray-500">{t("gp_no_packs")}</p>
            </div>
          )}

          {!loading && packs.length > 0 && (
            <div className="space-y-3">
              {packs.map((pack, i) => (
                <Link
                  key={pack.id}
                  href={`/tools/goipack/pack/${pack.id}`}
                  className="group flex items-center justify-between rounded-2xl bg-white/45 backdrop-blur-xl border border-white/80 p-5 transition-all hover:bg-white/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    transition: "transform 150ms ease-out, box-shadow 150ms ease-out, background-color 200ms ease-out",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1A1A2E] text-[15px]" style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}>
                      {pack.name_ja}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">{pack.name_en}</p>
                    {pack.description && (
                      <p className="mt-1.5 text-xs text-gray-400 line-clamp-1">{pack.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-emerald-100/60 border border-emerald-200/50 px-3 py-1 text-[10px] font-bold text-emerald-700 backdrop-blur-sm">
                      {pack.word_count} {t("gp_words")}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/60 border border-white/90 flex items-center justify-center text-gray-400 text-sm transition-all group-hover:bg-[#1A1A2E] group-hover:text-white group-hover:translate-x-0.5">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
