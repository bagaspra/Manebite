"use client";

import { useEffect, useState } from "react";
import { getVideos, type Video } from "@/lib/api";
import Link from "next/link";
import styles from "@/components/GlassUI.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

function SkeletonCard() {
  return (
    <div className={styles.vcard} style={{ height: "240px", padding: 0 }}>
      <div className="animate-pulse bg-gray-200 h-1/2 w-full" />
      <div className={`${styles.vbody} p-4`}>
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 mb-2" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { t } = useLanguage();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getVideos("public")
      .then(setVideos)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = search.trim()
    ? videos.filter(
        (v) =>
          v.title?.toLowerCase().includes(search.toLowerCase()) ||
          v.channel?.toLowerCase().includes(search.toLowerCase())
      )
    : videos;

  return (
    <div className={styles.page}>
      <div className={styles.mainSection}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolIcon}>🌐</div>
            <div>
              <div className={styles.toolTitle}>{t("shad_lib_title")}</div>
              <div className={styles.toolSub}>{t("shad_lib_desc")}</div>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.tabs}>
              <Link href="/tools/shadowing" className={styles.tab}>{t("shad_my_queue")}</Link>
              <div className={`${styles.tab} ${styles.tabActive}`}>{t("shad_library")}</div>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shad_lib_search")}
              className={styles.urlInput}
              style={{ maxWidth: "200px", padding: "6px 14px", marginLeft: "10px" }}
            />
          </div>
        </div>

        {/* Video Grid */}
        <div className={styles.videoGrid}>
          {isLoading ? (
            [1, 2, 3].map(i => <SkeletonCard key={i} />)
          ) : filtered.length > 0 ? (
            filtered.map((video) => (
              <Link href={`/tools/shadowing/videos/${video.id}`} className={styles.vcard} key={video.id}>
                <div 
                  className={styles.vcardThumb} 
                  style={{ overflow: "hidden", background: "none" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title ?? video.youtube_id}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className={styles.playOverlay}>
                    <div className={styles.playBtn}>▶</div>
                  </div>
                </div>
                <div className={styles.vbody}>
                  <div className={styles.vtitle} title={video.title || video.youtube_id}>
                    {video.title ?? video.youtube_id}
                  </div>
                  <div className={styles.vchannel}>{video.channel || "Unknown"}</div>
                  <div className={styles.vstats}>
                    <div className={styles.vs}>📝 {video.sentence_count} sentences</div>
                    <div className={styles.vs}>⏱ {Math.floor(video.sentence_count / 12)} min</div>
                  </div>
                  <div className={styles.vprog}>
                    <div className={styles.vpf} style={{ width: "0%" }}></div>
                  </div>
                  <div className={styles.vactions}>
                    <button className={styles.btnS}>Shadow →</button>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-sm font-bold text-gray-800">
                {search ? t("shad_lib_no_results") : t("shad_lib_no_videos")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {search ? t("shad_lib_try_different") : t("shad_lib_share_hint")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
