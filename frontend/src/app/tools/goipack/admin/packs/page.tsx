"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  gpAdminGetCategories,
  gpAdminGetPacks,
  gpAdminGetPack,
  gpAdminCreatePack,
  gpAdminGenerateWords,
  gpAdminGenerateRuby,
  gpAdminUpdatePack,
  gpAdminPublishPack,
  gpAdminDeletePack,
  type GoiCategory,
  type GoiPack,
  type GoiWordInput,
} from "@/lib/api";
import styles from "@/components/GlassUI.module.css";
import { AdminLayoutShell } from "@/components/DashboardShell";

const JLPT_OPTIONS = [
  { value: 5, label: "N5" },
  { value: 4, label: "N4" },
  { value: 3, label: "N3" },
  { value: 2, label: "N2" },
  { value: 1, label: "N1" },
];

const JLPT_COLORS: Record<number, string> = {
  5: "bg-emerald-100/70 text-emerald-700 border-emerald-200/50",
  4: "bg-teal-100/70 text-teal-700 border-teal-200/50",
  3: "bg-sky-100/70 text-sky-700 border-sky-200/50",
  2: "bg-amber-100/70 text-amber-700 border-amber-200/50",
  1: "bg-red-100/70 text-red-700 border-red-200/50",
};

type WordRow = GoiWordInput & { _key: string; _expanded: boolean };

function makeKey() { return Math.random().toString(36).slice(2); }

function emptyWord(sortOrder = 0): WordRow {
  return {
    _key: makeKey(), _expanded: false,
    surface: "", reading: "", jlpt_level: 3,
    meaning_en: "", meaning_id: "",
    examples_ja: ["", "", ""], examples_ja_ruby: null, examples_en: ["", "", ""], examples_id: ["", "", ""],
    sort_order: sortOrder,
  };
}

function wordRowFromInput(w: GoiWordInput, i: number): WordRow {
  return { ...w, _key: makeKey(), _expanded: false, sort_order: i };
}

export default function GoiPackAdminPacksPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  // List state
  const [categories, setCategories] = useState<GoiCategory[]>([]);
  const [packs, setPacks] = useState<GoiPack[]>([]);
  const [filterCatId, setFilterCatId] = useState<number | "">("");
  const [loadingList, setLoadingList] = useState(true);

  // Edit/create panel
  const [panel, setPanel] = useState<"none" | "create" | "edit">("none");
  const [editingPackId, setEditingPackId] = useState<number | null>(null);
  const [packForm, setPackForm] = useState({ category_id: 0, name_ja: "", name_en: "", name_id: "", description: "" });
  const [words, setWords] = useState<WordRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingRuby, setGeneratingRuby] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) loadAll();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userId) loadPacks();
  }, [filterCatId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    if (!userId) return;
    const [cats] = await Promise.all([gpAdminGetCategories(userId)]);
    setCategories(cats);
    await loadPacks();
  }

  async function loadPacks() {
    if (!userId) return;
    setLoadingList(true);
    try {
      setPacks(await gpAdminGetPacks(userId, filterCatId !== "" ? filterCatId : undefined));
    } finally {
      setLoadingList(false);
    }
  }

  function openCreate() {
    setPackForm({ category_id: categories[0]?.id ?? 0, name_ja: "", name_en: "", name_id: "", description: "" });
    setWords([]);
    setEditingPackId(null);
    setPanelError(null);
    setPanel("create");
  }

  async function openEdit(pack: GoiPack) {
    if (!userId) return;
    setEditingPackId(pack.id);
    setPackForm({ category_id: pack.category_id, name_ja: pack.name_ja, name_en: pack.name_en, name_id: pack.name_id, description: pack.description ?? "" });
    setPanelError(null);
    setPanel("edit");
    try {
      const detail = await gpAdminGetPack(pack.id, userId);
      setWords(detail.words.map((w, i) => wordRowFromInput(w, i)));
    } catch {
      setWords([]);
    }
  }

  // ── Create pack then generate ──
  async function handleCreateAndGenerate() {
    if (!userId || !packForm.name_ja || !packForm.name_en) {
      setPanelError("Isi minimal nama JA dan EN.");
      return;
    }
    setSaving(true);
    setPanelError(null);
    try {
      const newPack = await gpAdminCreatePack({
        category_id: packForm.category_id,
        name_ja: packForm.name_ja,
        name_en: packForm.name_en,
        name_id: packForm.name_id,
        description: packForm.description || undefined,
      }, userId);
      setEditingPackId(newPack.id);
      setPanel("edit");
      await loadPacks();
      await doGenerate(newPack.id);
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Gagal membuat pack.");
    } finally {
      setSaving(false);
    }
  }

  async function doGenerate(packId: number) {
    if (!userId) return;
    setGenerating(true);
    setPanelError(null);
    try {
      const res = await gpAdminGenerateWords(packId, userId);
      setWords(res.words.map((w, i) => wordRowFromInput(w, i)));
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Generate gagal.");
    } finally {
      setGenerating(false);
    }
  }

  async function doGenerateRuby() {
    if (!userId || editingPackId == null) return;
    setGeneratingRuby(true);
    setPanelError(null);
    try {
      await gpAdminGenerateRuby(editingPackId, userId);
      const detail = await gpAdminGetPack(editingPackId, userId);
      setWords(detail.words.map((w, i) => wordRowFromInput(w, i)));
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Generate furigana gagal.");
    } finally {
      setGeneratingRuby(false);
    }
  }

  async function handleSaveDraft() {
    if (!userId || editingPackId == null) return;
    setSaving(true);
    setPanelError(null);
    try {
      await gpAdminUpdatePack(editingPackId, {
        name_ja: packForm.name_ja,
        name_en: packForm.name_en,
        name_id: packForm.name_id,
        description: packForm.description || null,
        words: words.map(({ _key, _expanded, ...w }) => w),
      }, userId);
      await loadPacks();
      alert("Draft saved!");
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!userId || editingPackId == null) return;
    setPublishing(true);
    setPanelError(null);
    try {
      await gpAdminUpdatePack(editingPackId, {
        name_ja: packForm.name_ja,
        name_en: packForm.name_en,
        name_id: packForm.name_id,
        description: packForm.description || null,
        words: words.map(({ _key, _expanded, ...w }) => w),
      }, userId);
      await gpAdminPublishPack(editingPackId, userId);
      await loadPacks();
      setPanel("none");
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Gagal publish.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeletePack(pack: GoiPack) {
    if (!userId) return;
    if (!confirm(`Delete pack "${pack.name_ja}"?\nAll words inside will also be deleted.`)) return;
    setDeletingId(pack.id);
    try {
      await gpAdminDeletePack(pack.id, userId);
      setPacks((prev) => prev.filter((p) => p.id !== pack.id));
      if (editingPackId === pack.id) setPanel("none");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  function updateWord(key: string, field: string, value: unknown) {
    setWords((prev) => prev.map((w) => w._key === key ? { ...w, [field]: value } : w));
  }

  function updateExample(key: string, lang: "ja" | "en" | "id", i: number, value: string) {
    setWords((prev) => prev.map((w) => {
      if (w._key !== key) return w;
      const field = `examples_${lang}` as "examples_ja" | "examples_en" | "examples_id";
      const arr = [...w[field]];
      arr[i] = value;
      return { ...w, [field]: arr };
    }));
  }

  function removeWord(key: string) {
    setWords((prev) => prev.filter((w) => w._key !== key).map((w, i) => ({ ...w, sort_order: i })));
  }

  function addEmptyWord() {
    setWords((prev) => [...prev, emptyWord(prev.length)]);
  }

  const PageContent = (
    <div className="animate-fadeUp space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Vocabulary Packs</h1>
          <p className="text-sm text-gray-500 font-medium">Create and manage content for GoiPack</p>
        </div>
        <button
          onClick={openCreate}
          className="px-6 py-3 rounded-xl bg-[#1A1A2E] text-white font-bold text-sm hover:bg-[#2d2d45] transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <span>＋</span> Create New Pack
        </button>
      </div>

      {panel === "none" && (
        <div className="space-y-4">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Packs ({packs.length})</p>
              <select
                value={filterCatId}
                onChange={(e) => setFilterCatId(e.target.value === "" ? "" : Number(e.target.value))}
                className={`${styles.urlInput} !px-4 !py-2 !text-xs font-bold !rounded-xl min-w-[200px] shadow-sm`}
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name_ja}</option>)}
              </select>
           </div>

           {loadingList ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-2xl bg-white/30 animate-pulse border border-white/50" />)}
              </div>
           ) : packs.length === 0 ? (
              <div className="py-20 text-center bg-white/20 rounded-2xl border border-dashed border-white/50 text-gray-400 font-bold">
                 No packs found. Click "Create New Pack" to start.
              </div>
           ) : (
              <div className="overflow-hidden rounded-2xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/30 border-b border-white/60">
                    <tr className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                      <th className="px-6 py-4">Title / ID</th>
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4 text-center">Words</th>
                      <th className="px-4 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {packs.map((pack) => (
                      <tr key={pack.id} className="group hover:bg-white/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#1A1A2E]" style={{ fontFamily: "var(--font-noto-sans-jp, 'Noto Sans JP', sans-serif)" }}>{pack.name_ja}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{pack.name_en}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[10px] font-bold text-gray-500 bg-white/60 px-2 py-1 rounded-lg border border-white/80">{pack.category_name_ja}</span>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-[#1A1A2E]">{pack.word_count}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${pack.is_published ? "bg-emerald-100/70 text-emerald-700 border border-emerald-200/50" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                            {pack.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 text-[11px] font-bold">
                            <button onClick={() => openEdit(pack)} className="px-4 py-1.5 rounded-lg border border-white/80 bg-white/50 text-gray-600 hover:bg-[#1A1A2E] hover:text-white transition-all shadow-sm">Edit</button>
                            <button onClick={() => handleDeletePack(pack)} className="px-4 py-1.5 rounded-lg border border-red-100 bg-red-100/50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           )}
        </div>
      )}

      {panel === "edit" && editingPackId != null && (
        <div className="animate-fadeUp space-y-6">
          <div className="flex items-center justify-between gap-4 px-1">
             <h2 className="text-xl font-bold text-[#1A1A2E]">Editing: <span className="text-emerald-600">{packForm.name_ja}</span></h2>
             <div className="flex gap-2">
                <button onClick={doGenerateRuby} className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-100/50 px-4 py-2 text-[11px] font-bold text-purple-700 hover:bg-purple-200/50 transition-all">🔤 Furigana</button>
                <button onClick={() => doGenerate(editingPackId)} className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-100/50 px-4 py-2 text-[11px] font-bold text-sky-700 hover:bg-sky-200/50 transition-all">🤖 Re-Generate</button>
             </div>
          </div>
          
          <div className="p-8 rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm space-y-6">
            <div className="grid gap-5 sm:grid-cols-3">
               {(["name_ja", "name_en", "name_id"] as const).map(f => (
                 <div key={f}>
                   <label className="mb-2 block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{f === "name_ja" ? "日本語" : f === "name_en" ? "English" : "Indonesia"}</label>
                   <input value={packForm[f]} onChange={e => setPackForm({...packForm, [f]: e.target.value})} className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4 font-bold`} />
                 </div>
               ))}
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
              <input value={packForm.description} onChange={e => setPackForm({...packForm, description: e.target.value})} className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4 text-sm`} />
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm">
             <div className="mb-6 flex items-center justify-between px-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vocabulary List ({words.length})</p>
                <button onClick={addEmptyWord} className="text-[11px] font-bold text-sky-600 bg-sky-100/50 px-4 py-2 rounded-xl border border-sky-200/50 hover:bg-sky-200/50 transition-all">+ Add Word</button>
             </div>
             
             <div className="space-y-4">
                {words.map((word, idx) => (
                  <div key={word._key} className="rounded-2xl border border-white/80 bg-white/40 overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_1fr_80px_1fr_1fr_auto_auto] items-center gap-3 px-5 py-4">
                       <span className="text-[10px] font-bold text-gray-300 w-4">{idx + 1}</span>
                       <input value={word.surface} onChange={e => updateWord(word._key, "surface", e.target.value)} placeholder="Word" className="font-bold text-[#1A1A2E] bg-white/60 border border-white/80 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20" />
                       <input value={word.reading} onChange={e => updateWord(word._key, "reading", e.target.value)} placeholder="Reading" className="text-gray-500 bg-white/60 border border-white/80 rounded-lg px-3 py-2 text-sm outline-none" />
                       <select value={word.jlpt_level} onChange={e => updateWord(word._key, "jlpt_level", Number(e.target.value))} className={`rounded-lg border px-2 py-2 text-[10px] font-bold uppercase ${JLPT_COLORS[word.jlpt_level] || "bg-gray-100"}`}>
                         {JLPT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                       </select>
                       <input value={word.meaning_en} onChange={e => updateWord(word._key, "meaning_en", e.target.value)} placeholder="Meaning EN" className="text-gray-600 bg-white/60 border border-white/80 rounded-lg px-3 py-2 text-xs" />
                       <input value={word.meaning_id} onChange={e => updateWord(word._key, "meaning_id", e.target.value)} placeholder="Arti ID" className="text-gray-600 bg-white/60 border border-white/80 rounded-lg px-3 py-2 text-xs" />
                       <button onClick={() => updateWord(word._key, "_expanded", !word._expanded)} className={`w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 text-gray-400 hover:text-[#1A1A2E] border border-white/80 ${word._expanded ? "bg-[#1A1A2E] text-white" : ""}`}>{word._expanded ? "▲" : "📝"}</button>
                       <button onClick={() => removeWord(word._key)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-100">×</button>
                    </div>
                    {word._expanded && (
                      <div className="border-t border-white/60 bg-white/30 p-5 space-y-4 animate-fadeUp">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Example Contexts</p>
                         {[0,1,2].map(i => (
                           <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/30 last:border-0 last:pb-0">
                             <textarea value={word.examples_ja[i]} onChange={e => updateExample(word._key, "ja", i, e.target.value)} rows={2} className="w-full rounded-xl bg-white/60 border border-white/80 px-3 py-2 text-sm font-medium" placeholder="JA context" />
                             <textarea value={word.examples_en[i]} onChange={e => updateExample(word._key, "en", i, e.target.value)} rows={2} className="w-full rounded-xl bg-white/60 border border-white/80 px-3 py-2 text-[11px] font-medium" placeholder="EN translation" />
                             <textarea value={word.examples_id[i]} onChange={e => updateExample(word._key, "id", i, e.target.value)} rows={2} className="w-full rounded-xl bg-white/60 border border-white/80 px-3 py-2 text-[11px] font-medium" placeholder="ID translation" />
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
          
          <div className="sticky bottom-6 left-0 right-0 py-4 px-8 rounded-3xl bg-[#1A1A2E]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-between z-40">
             <p className="text-white text-xs font-bold">Manage Draft & Publication</p>
             <div className="flex gap-3">
                <button onClick={handleSaveDraft} disabled={saving} className="px-6 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-[13px] font-bold hover:bg-white/20">Save Draft</button>
                <button onClick={handlePublish} disabled={publishing} className="px-8 py-2.5 rounded-xl bg-emerald-500 text-white text-[13px] font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">✅ Publish</button>
                <button onClick={() => setPanel("none")} className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-200 text-[13px] font-bold hover:bg-red-500/30">Close</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayoutShell activeHref="/tools/goipack/admin/packs">
      {PageContent}

      {panel === "create" && (
        <div className="animate-fadeUp fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A2E]/30 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white shadow-2xl">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-6 flex items-center gap-3">
               <span className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-xl">📦</span>
               Create New Vocabulary Pack
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="mb-2 block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Category</label>
                    <select value={packForm.category_id} onChange={e => setPackForm({...packForm, category_id: Number(e.target.value)})} className={`${styles.urlInput} w-full !rounded-xl !py-3 !px-4 font-bold`}>
                       {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_ja}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="mb-2 block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nama 日本語</label>
                    <input value={packForm.name_ja} onChange={e => setPackForm({...packForm, name_ja: e.target.value})} className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4 font-bold`} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <input value={packForm.name_en} onChange={e => setPackForm({...packForm, name_en: e.target.value})} placeholder="English Name" className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4`} />
                 <input value={packForm.name_id} onChange={e => setPackForm({...packForm, name_id: e.target.value})} placeholder="Nama Indonesia" className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4`} />
              </div>
              <textarea value={packForm.description} onChange={e => setPackForm({...packForm, description: e.target.value})} placeholder="Description (Optional)" className={`${styles.urlInput} w-full !rounded-xl shadow-inner !py-3 !px-4 min-h-[100px]`} />
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreateAndGenerate} disabled={saving} className="flex-1 rounded-xl bg-sky-600 text-white font-bold text-sm py-4 hover:bg-sky-700 shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50">✨ Create & Auto-Generate</button>
                <button onClick={() => setPanel("none")} className="px-8 rounded-xl border border-white bg-white/40 font-bold text-gray-500 hover:bg-white/60 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
