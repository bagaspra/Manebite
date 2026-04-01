"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  gpAdminGetCategories,
  gpAdminCreateCategory,
  gpAdminDeleteCategory,
  gpAdminUpdateCategory,
  type GoiCategory,
} from "@/lib/api";
import styles from "@/components/GlassUI.module.css";
import { AdminLayoutShell } from "@/components/DashboardShell";

export default function GoiPackAdminCategoriesPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [categories, setCategories] = useState<GoiCategory[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameJa, setNameJa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameId, setNameId] = useState("");
  const [icon, setIcon] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userId) loadCategories();
  }, [userId]);

  async function loadCategories() {
    if (!userId) return;
    setLoadingList(true);
    try {
      setCategories(await gpAdminGetCategories(userId));
    } finally {
      setLoadingList(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setNameJa("");
    setNameEn("");
    setNameId("");
    setIcon("");
  }

  function startEdit(cat: GoiCategory) {
    setEditingId(cat.id);
    setNameJa(cat.name_ja);
    setNameEn(cat.name_en);
    setNameId(cat.name_id);
    setIcon(cat.icon);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !nameJa || !nameEn) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await gpAdminUpdateCategory(editingId, { name_ja: nameJa, name_en: nameEn, name_id: nameId, icon }, userId);
      } else {
        await gpAdminCreateCategory({ name_ja: nameJa, name_en: nameEn, name_id: nameId, icon }, userId);
      }
      resetForm();
      loadCategories();
    } catch {
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(catId: number) {
    if (!userId) return;
    if (!confirm("Delete this category? It might affect assigned packs.")) return;
    try {
      await gpAdminDeleteCategory(catId, userId);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    } catch {
      alert("Failed to delete.");
    }
  }

  const PageContent = (
    <div className="animate-fadeUp space-y-10">
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Goi Categories</h1>
        <p className="text-sm text-gray-500 font-medium">Create and coordinate vocabulary groups</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        {/* Creation Form */}
        <div className="p-8 h-fit rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm sticky top-24">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">
             {editingId ? "Edit Category" : "Add New Category"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Icon (Emoji)</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4`} placeholder="e.g. 🎒" />
            </div>
            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama 日本語</label>
              <input value={nameJa} onChange={(e) => setNameJa(e.target.value)} required className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4 font-bold`} style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }} />
            </div>
            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">English Name</label>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4 font-medium`} />
            </div>
            <div className="space-y-1.5 px-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Indonesia</label>
               <input value={nameId} onChange={(e) => setNameId(e.target.value)} className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4 font-medium`} />
            </div>

            <div className="flex gap-2 pt-2">
              <button disabled={isSaving} type="submit" className="flex-1 rounded-xl bg-[#1A1A2E] py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#2d2d45] active:scale-95 disabled:opacity-50">
                {isSaving ? "Saving..." : (editingId ? "Update" : "Create Category")}
              </button>
              {editingId && (
                 <button onClick={resetForm} type="button" className="px-5 rounded-xl border border-white bg-white/40 text-xs font-bold text-gray-500 hover:bg-white/60 transition-all">Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* Categories Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Categories ({categories.length})</p>
          </div>

          {loadingList ? (
             <div className="space-y-3">
               {[1, 2, 3].map(i => <div key={i} className="h-20 w-full rounded-2xl bg-white/30 animate-pulse border border-white/50" />)}
             </div>
          ) : categories.length === 0 ? (
             <div className="py-20 text-center bg-white/20 rounded-2xl border border-dashed border-white/50 text-gray-400 font-bold">
               No categories defined yet.
             </div>
          ) : (
             <div className="overflow-hidden rounded-2xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/30 border-b border-white/60">
                    <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                       <th className="px-6 py-4">Symbol + Title</th>
                       <th className="px-4 py-4">English / ID</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {categories.map((c) => (
                      <tr key={c.id} className="group hover:bg-white/40 transition-all border-b border-white/30 last:border-0 translate-z-0">
                        <td className="px-6 py-4 flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white/70 border border-white/90 shadow-sm flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                             {c.icon || "📦"}
                           </div>
                           <div>
                              <p className="font-bold text-[#1A1A2E]" style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}>{c.name_ja}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {c.id}</p>
                           </div>
                        </td>
                        <td className="px-4 py-4">
                           <p className="font-bold text-gray-600 text-xs">{c.name_en}</p>
                           <p className="text-[10px] font-medium text-gray-400">{c.name_id}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => startEdit(c)} className="rounded-lg border border-white bg-white/60 px-4 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-[#1A1A2E] hover:text-white transition-all shadow-sm">Edit</button>
                            <button onClick={() => handleDelete(c.id)} className="rounded-lg border border-red-100 bg-red-50 px-4 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayoutShell activeHref="/tools/goipack/admin/categories">
      {PageContent}
    </AdminLayoutShell>
  );
}
