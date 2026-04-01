"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { deleteVideo, getVideos, submitVideo, type Video } from "@/lib/api";
import styles from "@/components/GlassUI.module.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

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

export default function MyQueuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/tools/shadowing");
    }
  }, [status, router]);

  async function loadVideos() {
    if (!userId) { setIsLoading(false); return; }
    try {
      const data = await getVideos("mine", userId);
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadVideos(); }, [userId]);

  async function handleDelete(id: number) {
    if (!userId) return;
    try {
      await deleteVideo(id, userId);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success(t("shad_delete_success"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete video.";
      toast.error(t("shad_delete_fail"));
      setError(msg);
    }
  }

  async function handleAddVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await submitVideo(url.trim(), userId, isPublic);
      
      // Update the videos list immediately by prepending the new video
      // and filtering out any duplicates if accidentally present
      setVideos((prev) => {
        const otherVideos = prev.filter(v => v.id !== res.video.id);
        return [res.video, ...otherVideos];
      });

      setUrl("");
      setIsPublic(false);
      setShowForm(false);
      toast.success(t("shad_add_success"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add video.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className={styles.page}>
        <div className={styles.mainSection}>
          <div className={styles.videoGrid}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // Generate random stable gradients for backgrounds to mimic the design
  const cardGradients = [
    "linear-gradient(135deg, #ddd6fe, #bfdbfe)",
    "linear-gradient(135deg, #d1fae5, #a7f3d0)",
    "linear-gradient(135deg, #fef3c7, #fde68a)",
    "linear-gradient(135deg, #fbcfe8, #fce7f3)",
    "linear-gradient(135deg, #bfdbfe, #dbeafe)",
  ];

  return (
    <div className={styles.page}>
      <div className={styles.mainSection}>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolIcon}>🎧</div>
            <div>
              <div className={styles.toolTitle}>{t("shad_queue_title")}</div>
              <div className={styles.toolSub}>{t("shad_queue_desc")}</div>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.tabs}>
              <div className={`${styles.tab} ${styles.tabActive}`}>{t("shad_my_queue")}</div>
              <Link href="/tools/shadowing/library" className={styles.tab}>{t("shad_library")}</Link>
            </div>
            <button
              className={styles.btnSubmit}
              onClick={() => setShowForm(!showForm)}
            >
              {t("shad_add_video_label")}
            </button>
          </div>
        </div>

        {/* Submit Form Inline */}
        {showForm && (
          <form className={styles.submitForm} onSubmit={handleAddVideo}>
            <input
              className={styles.urlInput}
              placeholder="Paste YouTube URL here... e.g. https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
            />
            <button 
              type="button"
              className={styles.visToggle} 
              onClick={() => setIsPublic(!isPublic)}
            >
              {isPublic ? "🌐 Public" : "🔒 Private"}
            </button>
            <button type="submit" className={styles.btnGo} disabled={isSubmitting || !url.trim()}>
              {isSubmitting ? t("common_loading") : "Process →"}
            </button>
          </form>
        )}

        {error && (
          <div className="m-4 flex items-center justify-between rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Video Grid */}
        <div className={styles.videoGrid}>
          {isLoading ? (
            <SkeletonCard />
          ) : videos.length > 0 ? (
            videos.map((video, idx) => (
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
                  <div className={styles.topBadges}>
                    {video.is_public ? (
                      <div className={styles.tbadge} title="Public">🌐</div>
                    ) : (
                      <div className={styles.tbadge} title="Private">🔒</div>
                    )}
                  </div>
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
                    <div className={styles.btnS}>{t("shad_sentences")} →</div>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <button
                            type="button"
                            className={styles.btnD}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            title="Delete video"
                          >
                            🗑
                          </button>
                        }
                      />
                      <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-white/50 rounded-[24px] shadow-2xl max-w-[400px]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[#1A1A2E] text-xl font-bold">{t("shad_delete_title")}</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500 text-sm leading-relaxed">
                            {t("shad_delete_desc_1")} <span className="font-semibold text-gray-700">"{video.title}"</span> {t("shad_delete_desc_2")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 flex gap-3">
                          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 border-none rounded-xl font-semibold text-gray-700" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            {t("shad_delete_cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(video.id); }}
                            className="bg-[#1A1A2E] hover:bg-red-600 text-white border-none rounded-xl font-semibold transition-all duration-300"
                          >
                            {t("shad_delete_confirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Link>
            ))
          ) : null}

          {/* Empty Add Card */}
          <div className={styles.vcardEmpty} onClick={() => setShowForm(true)}>
            <div className={styles.emptyPlus}>+</div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF" }}>Submit a new video</div>
            <div style={{ fontSize: "10px", color: "#C4B5FD" }}>Paste a YouTube URL to start</div>
          </div>
        </div>

      </div>
    </div>
  );
}
