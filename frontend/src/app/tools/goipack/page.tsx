"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { gpGetCategories, type GoiCategory } from "@/lib/api";
import styles from "@/components/GlassUI.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6 md:p-10">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl bg-white/30 border border-white/50 p-6 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-white/50 mb-4" />
          <div className="h-4 w-2/3 rounded bg-white/50 mb-2" />
          <div className="h-3 w-1/2 rounded bg-white/40" />
        </div>
      ))}
    </div>
  );
}

export default function GoiPackPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<GoiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gpGetCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.mainSection} style={{ padding: 0 }}>
        
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolIcon} style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>語</div>
            <div>
              <div className={styles.toolTitle}>{t("gp_title")}</div>
              <div className={styles.toolSub}>{t("gp_subtitle")}</div>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
              <span className="bg-white/40 border border-white/60 rounded-full px-3 py-1">
                {loading ? "..." : `${categories.length} ${t("gp_category").toLowerCase()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && <SkeletonGrid />}

        {error && (
          <div className="p-6 md:p-10">
            <div className="p-4 bg-red-100/80 border border-red-200 text-red-600 rounded-xl text-center text-sm font-semibold">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="p-6 md:p-10">
            <div className="py-20 text-center bg-white/20 rounded-2xl border border-dashed border-white/50">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-sm font-bold text-gray-500">{t("gp_no_categories")}</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon — new packs are added regularly.</p>
            </div>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6 md:p-10">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/tools/goipack/${cat.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white/45 backdrop-blur-xl border border-white/80 p-6 transition-all hover:bg-white/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5"
                style={{
                  animationDelay: `${i * 0.06}s`,
                  transition: "transform 150ms ease-out, box-shadow 150ms ease-out, background-color 200ms ease-out",
                }}
              >
                {/* Decorative shimmer line */}
                <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/70 border border-white/90 shadow-sm flex items-center justify-center text-3xl shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1A1A2E] text-[15px] mb-0.5" style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}>
                      {cat.name_ja}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">{cat.name_en}</p>
                    {cat.pack_count != null && (
                      <p className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-100/50 rounded-full px-2 py-0.5 w-fit">
                        {cat.pack_count} packs
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/60 border border-white/90 flex items-center justify-center text-gray-400 text-sm shrink-0 transition-all group-hover:bg-[#1A1A2E] group-hover:text-white group-hover:translate-x-0.5">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
