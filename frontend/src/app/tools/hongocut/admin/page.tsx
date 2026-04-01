"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  hcGetVideos,
  hcSubmitVideo,
  hcDeleteVideo,
  type HcVideo,
} from "@/lib/api";
import styles from "@/components/GlassUI.module.css";
import { AdminLayoutShell } from "@/components/DashboardShell";

export default function HongoCutAdminPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [videos, setVideos] = useState<HcVideo[]>([]);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [processStatus, setProcessStatus] = useState<string | null>(null);

  useEffect(() => {
    if (userId) loadVideos();
  }, [userId]);

  async function loadVideos() {
    if (!userId) return;
    setLoadingList(true);
    try {
      setVideos(await hcGetVideos(userId));
    } finally {
      setLoadingList(false);
    }
  }

  async function handleProcess(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !url) return;
    setIsProcessing(true);
    setProcessStatus("⏳ Processing video...");
    try {
      await hcSubmitVideo(url, userId);
      setUrl("");
      setProcessStatus("✅ Video indexed successfully!");
      loadVideos();
    } catch (err) {
      setProcessStatus("❌ Failed to process video.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessStatus(null), 5000);
    }
  }

  async function handleDelete(video: HcVideo) {
    if (!userId) return;
    if (!confirm(`Delete video "${video.title}"?`)) return;
    try {
      await hcDeleteVideo(video.id, userId);
      setVideos((v) => v.filter((item) => item.id !== video.id));
    } catch {
      alert("Failed to delete.");
    }
  }

  const PageContent = (
    <div className="animate-fadeUp space-y-10">
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Video Management</h1>
        <p className="text-sm text-gray-500 font-medium">Index and manage YouTube videos for word search</p>
      </div>

      {/* Index Form Card */}
      <div className="p-8 rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Index New Video</p>
          <form onSubmit={handleProcess} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Masukkan URL YouTube (misal: https://youtu.be/...)"
              className={`${styles.urlInput} flex-1 shadow-inner !rounded-xl !py-3 !px-5 !text-sm`}
              required
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="px-8 py-3 rounded-xl bg-[#1A1A2E] text-white font-bold text-sm hover:bg-[#2d2d45] transition-all shadow-lg active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {isProcessing ? "Processing..." : "✨ Index Video"}
            </button>
          </form>
          {processStatus && (
            <p className="mt-4 text-xs font-bold animate-fadeUp px-1">{processStatus}</p>
          )}
        </div>
      </div>

      {/* Video Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Indexed Videos ({videos.length})</p>
        </div>

        {loadingList ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-2xl bg-white/30 animate-pulse border border-white/50" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="py-20 text-center bg-white/20 rounded-2xl border border-dashed border-white/50 text-gray-400 font-bold">
            Belum ada video yang diindeks.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/30 border-b border-white/60">
                <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  <th className="px-6 py-4">Video Info</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {videos.map((v) => (
                  <tr key={v.id} className="group hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1A1A2E] line-clamp-1">{v.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[300px]">{v.youtube_id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-emerald-100/70 border border-emerald-200/50 px-3 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Indexed
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(v)}
                        className="rounded-lg border border-red-100 bg-red-50 px-4 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayoutShell activeHref="/tools/hongocut/admin">
      {PageContent}
    </AdminLayoutShell>
  );
}
