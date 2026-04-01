export type Lang = "en" | "id" | "ja";

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  id: "Indonesia",
  ja: "日本語",
};

const translations = {
  // ── Navbar ─────────────────────────────────────────────────────────────────
  nav_back_home: { en: "← Home", id: "← Beranda", ja: "← ホーム" },
  nav_sign_out:  { en: "Sign out", id: "Keluar", ja: "ログアウト" },
  nav_log_in:    { en: "Log in", id: "Masuk", ja: "ログイン" },

  // ── Home page ───────────────────────────────────────────────────────────────
  home_hero_title: {
    en: "Learn Japanese the way\nnative speakers use it",
    id: "Belajar Jepang seperti\npenutur aslinya",
    ja: "ネイティブのように\n日本語を学ぼう",
  },
  home_hero_desc: {
    en: "A focused set of tools to build real Japanese fluency — not test scores.",
    id: "Kumpulan tools untuk membangun kemampuan bahasa Jepang yang nyata.",
    ja: "テストのためでなく、本物の日本語力を伸ばすツール集。",
  },
  home_start_learning: {
    en: "Start learning →",
    id: "Mulai belajar →",
    ja: "学習を始める →",
  },
  home_try_guest: {
    en: "Try as guest",
    id: "Coba sebagai tamu",
    ja: "ゲストで試す",
  },
  home_choose_tool: {
    en: "CHOOSE A TOOL",
    id: "PILIH TOOL",
    ja: "ツールを選ぶ",
  },
  home_badge_active: {
    en: "Active",
    id: "Aktif",
    ja: "利用可能",
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dash_admin_label: { en: "ADMIN PANEL", id: "PANEL ADMIN", ja: "管理パネル" },
  dash_content_mgmt: { en: "Content Management", id: "Manajemen Konten", ja: "コンテンツ管理" },
  dash_your_account: { en: "YOUR ACCOUNT", id: "AKUN ANDA", ja: "アカウント" },
  dash_quick_access: { en: "Quick Access", id: "Akses Cepat", ja: "クイックアクセス" },
  dash_all_tools: { en: "All Tools", id: "Semua Tools", ja: "全ツール" },
  dash_all_tools_desc: {
    en: "Browse Shadowing, Keigo, HongoCut, and GoiPack.",
    id: "Jelajahi Shadowing, Keigo, HongoCut, dan GoiPack.",
    ja: "Shadowing・Keigo・HongoCut・GoiPack を使う",
  },
  dash_settings: { en: "Settings", id: "Pengaturan", ja: "設定" },
  dash_settings_desc: {
    en: "Language and preferences.",
    id: "Bahasa dan preferensi.",
    ja: "言語と設定",
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  settings_title:  { en: "SETTINGS", id: "PENGATURAN", ja: "設定" },
  settings_heading: { en: "Settings", id: "Pengaturan", ja: "設定" },
  settings_language: { en: "Language", id: "Bahasa", ja: "言語" },
  settings_language_desc: {
    en: "Choose your preferred interface language.",
    id: "Pilih bahasa antarmuka yang kamu inginkan.",
    ja: "インターフェースの表示言語を選択してください。",
  },
  settings_saved: { en: "Saved", id: "Tersimpan", ja: "保存済み" },

  // ── Shadowing subnav ───────────────────────────────────────────────────────
  shad_my_queue:  { en: "My Queue", id: "Antrian Saya", ja: "マイキュー" },
  shad_library:   { en: "Library", id: "Perpustakaan", ja: "ライブラリ" },
  shad_add_video: { en: "Add Video", id: "Tambah Video", ja: "動画を追加" },

  // ── Shadowing queue page ───────────────────────────────────────────────────
  shad_queue_title: { en: "My Queue", id: "Antrian Saya", ja: "マイキュー" },
  shad_queue_desc: {
    en: "Videos you've added for shadowing practice",
    id: "Video yang kamu tambahkan untuk latihan shadowing",
    ja: "シャドーイング練習用の動画",
  },
  shad_add_video_label: { en: "Add a video", id: "Tambah video", ja: "動画を追加" },
  shad_empty_title: {
    en: "Your queue is empty.",
    id: "Antrian kamu kosong.",
    ja: "キューが空です。",
  },
  shad_empty_desc: {
    en: "Use the Add Video tab to add a YouTube video.",
    id: "Gunakan tab Tambah Video untuk menambahkan video YouTube.",
    ja: "「動画を追加」タブからYouTube動画を追加してください。",
  },
  shad_delete_title: {
    en: "Delete Video?",
    id: "Hapus Video?",
    ja: "動画を削除しますか？",
  },
  shad_delete_desc_1: {
    en: "Video",
    id: "Video",
    ja: "動画",
  },
  shad_delete_desc_2: {
    en: "will be permanently removed from your collection. Your learning progress will also be deleted.",
    id: "akan dihapus permanen dari koleksi Anda. Progres belajar Anda juga akan ikut terhapus.",
    ja: "はコレクションから完全に削除されます。学習の進捗も削除されます。",
  },
  shad_delete_cancel: {
    en: "Cancel",
    id: "Batal",
    ja: "キャンセル",
  },
  shad_delete_confirm: {
    en: "Yes, Delete",
    id: "Ya, Hapus",
    ja: "削除する",
  },

  // ── Shadowing library page ─────────────────────────────────────────────────
  shad_lib_title: { en: "Public Library", id: "Perpustakaan Publik", ja: "公開ライブラリ" },
  shad_lib_desc: {
    en: "Community-shared Japanese shadowing videos — no sign-in required.",
    id: "Video shadowing dari komunitas — tanpa login.",
    ja: "コミュニティの日本語動画 — ログイン不要",
  },
  shad_lib_search: {
    en: "Search by title or channel…",
    id: "Cari berdasarkan judul atau channel…",
    ja: "タイトルまたはチャンネルで検索…",
  },
  shad_lib_no_results: {
    en: "No videos match your search.",
    id: "Tidak ada video yang cocok.",
    ja: "検索結果がありません。",
  },
  shad_lib_no_videos: {
    en: "No public videos yet.",
    id: "Belum ada video publik.",
    ja: "公開動画がまだありません。",
  },
  shad_lib_try_different: {
    en: "Try a different keyword.",
    id: "Coba kata kunci lain.",
    ja: "別のキーワードで試してください。",
  },
  shad_lib_share_hint: {
    en: "Submit a video and toggle it public to share with the community.",
    id: "Tambahkan video dan jadikan publik untuk berbagi dengan komunitas.",
    ja: "動画を追加して公開にすると、コミュニティで共有できます。",
  },
  shad_delete_success: {
    en: "Video deleted successfully.",
    id: "Video berhasil dihapus.",
    ja: "動画を削除しました。",
  },
  shad_delete_fail: {
    en: "Could not delete video.",
    id: "Gagal menghapus video.",
    ja: "動画を削除できませんでした。",
  },
  shad_add_success: {
    en: "Video added to queue.",
    id: "Video berhasil ditambahkan.",
    ja: "動画をキューに追加しました。",
  },

  // ── Video detail ───────────────────────────────────────────────────────────
  shad_start_shadowing: {
    en: "Start Shadowing →",
    id: "Mulai Shadowing →",
    ja: "シャドーイング開始 →",
  },
  shad_back: { en: "← Back", id: "← Kembali", ja: "← 戻る" },
  shad_preview_label: {
    en: "PREVIEW — FIRST 5 SENTENCES",
    id: "PREVIEW — 5 KALIMAT PERTAMA",
    ja: "プレビュー — 最初の5文",
  },
  shad_sentences: { en: "sentences", id: "kalimat", ja: "文" },
  shad_more_sentences: {
    en: "more sentences in the full session.",
    id: "kalimat lagi di sesi lengkap.",
    ja: "文が全セッションに含まれています。",
  },

  // ── Session ────────────────────────────────────────────────────────────────
  sess_complete:         { en: "Session Complete!", id: "Sesi Selesai!", ja: "セッション完了！" },
  sess_shadowed:         { en: "You shadowed", id: "Kamu menshadow", ja: "シャドーした文：" },
  sess_of:               { en: "of", id: "dari", ja: "/" },
  sess_sentences_label:  { en: "sentences.", id: "kalimat.", ja: "文" },
  sess_practice_again:   { en: "Practice Again", id: "Ulangi Latihan", ja: "もう一度練習" },
  sess_back_to_shadowing:{ en: "Back to Shadowing", id: "Kembali ke Shadowing", ja: "シャドーイングに戻る" },
  sess_all_sentences:    { en: "All Sentences", id: "Semua Kalimat", ja: "全文" },
  sess_now_shadowing:    { en: "Now Shadowing", id: "Sedang Shadowing", ja: "シャドーイング中" },
  sess_sentence_of:      { en: "Sentence", id: "Kalimat", ja: "文" },
  sess_completed:        { en: "completed", id: "selesai", ja: "完了" },
  sess_select_word_hint: { en: "Select a word to look it up", id: "Pilih kata untuk dicari", ja: "単語を選んで調べる" },
  sess_keyboard_hint:    {
    en: "Space · N next · P prev · L mode · R rōmaji",
    id: "Space · N berikut · P sebelum · L mode · R rōmaji",
    ja: "スペース · N 次 · P 前 · L モード · R ローマ字",
  },

  // ── Keigo ──────────────────────────────────────────────────────────────────
  keigo_translate:    { en: "Translate →", id: "Terjemahkan →", ja: "翻訳する →" },
  keigo_translating:  { en: "Translating…", id: "Menerjemahkan…", ja: "翻訳中…" },
  keigo_recent:       { en: "RECENT TRANSLATIONS", id: "TERJEMAHAN TERAKHIR", ja: "最近の翻訳" },

  // ── HongoCut ───────────────────────────────────────────────────────────────
  hc_search:   { en: "Search", id: "Cari", ja: "検索" },
  hc_popular:  { en: "POPULAR WORDS", id: "KATA POPULER", ja: "人気の単語" },
  hc_no_results:{ en: "No clips found for", id: "Tidak ada klip untuk", ja: "クリップが見つかりません：" },
  hc_clips:    { en: "clips for", id: "klip untuk", ja: "件のクリップ：" },
  hc_load_more:{ en: "Load 20 more results", id: "Muat 20 hasil lagi", ja: "さらに20件読み込む" },
  hc_loading:  { en: "Loading...", id: "Memuat...", ja: "読み込み中..." },

  // ── GoiPack ────────────────────────────────────────────────────────────────
  gp_title:         { en: "Vocabulary Packs", id: "Paket Kosakata", ja: "語彙パック" },
  gp_subtitle:      {
    en: "Learn Japanese vocabulary grouped by topic.",
    id: "Pelajari kosakata Jepang yang dikelompokkan per topik.",
    ja: "トピック別に学ぶ日本語単語集",
  },
  gp_no_categories: { en: "No categories available yet.", id: "Belum ada kategori tersedia.", ja: "カテゴリがまだありません。" },
  gp_no_packs:      { en: "No packs available in this category yet.", id: "Belum ada pack di kategori ini.", ja: "このカテゴリにパックがまだありません。" },
  gp_no_words:      { en: "This pack has no words yet.", id: "Pack ini belum memiliki kata.", ja: "まだ単語がありません。" },
  gp_words:         { en: "words", id: "kata", ja: "単語" },
  gp_vocab_pack:    { en: "VOCABULARY PACK", id: "PAKET KOSAKATA", ja: "語彙パック" },
  gp_category:      { en: "Category", id: "Kategori", ja: "カテゴリ" },
  gp_packs:         { en: "packs", id: "pack", ja: "パック" },

  // ── Common ─────────────────────────────────────────────────────────────────
  common_loading:  { en: "Loading…", id: "Memuat…", ja: "読み込み中…" },
  common_error:    { en: "Something went wrong.", id: "Terjadi kesalahan.", ja: "エラーが発生しました。" },
} as const;

export type TranslationKey = keyof typeof translations;

export function getT(lang: Lang) {
  return function t(key: TranslationKey): string {
    return translations[key][lang] ?? translations[key]["en"];
  };
}
