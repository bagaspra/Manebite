"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { type Lang, LANG_LABELS } from "@/lib/i18n";

import { DashboardShell } from "@/components/DashboardShell";

const LANGUAGES: { value: Lang; label: string; native: string }[] = [
  { value: "en", label: "English",   native: "English" },
  { value: "id", label: "Indonesia", native: "Bahasa Indonesia" },
  { value: "ja", label: "Japanese",  native: "日本語" },
];

export default function SettingsPage() {
  const { lang, setLang, t } = useLanguage();
  const [saved, setSaved] = useState(false);

  function handleSelect(value: Lang) {
    setLang(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const SettingsContent = (
    <div className="animate-fadeUp space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">{t("settings_heading")}</h1>
        <p className="text-sm text-gray-500 font-medium">{t("settings_language_desc")}</p>
      </div>

      {/* Language card */}
      <div className="p-8 rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("settings_language")}</p>
          {saved && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 animate-fadeUp">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">✓</span>
              {t("settings_saved")}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {LANGUAGES.map((option) => {
            const isActive = lang === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`flex flex-col gap-1 p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isActive 
                  ? "bg-[#1A1A2E] border-[#1A1A2E] shadow-lg shadow-[#1A1A2E]/10" 
                  : "bg-white/40 border-white/80 hover:bg-white/60"
                }`}
              >
                <div className={`text-sm font-bold ${isActive ? "text-white" : "text-[#1A1A2E]"}`}>
                  {option.native}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-white/60" : "text-gray-400"}`}>
                  {option.label}
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                    ●
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell activeHref="/settings">
      {SettingsContent}
    </DashboardShell>
  );
}
