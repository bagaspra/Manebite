"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "@/components/GlassUI.module.css";
import { AdminLayoutShell } from "@/components/DashboardShell";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
      </div>
    );
  }

  const name = session.user?.name ?? session.user?.email ?? "User";
  const firstName = name.split(" ")[0];
  const email = session.user?.email ?? "";

  // The content of the main dashboard work area
  const OverviewContent = (
    <div className="animate-fadeUp space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Hello, {firstName}</h1>
        <p className="text-sm text-gray-500 font-medium">{t("dash_quick_access")}</p>
      </div>

      <div className="grid gap-6">
          <Link
            href="/"
            className="group flex items-center justify-between p-8 rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 transition-all hover:bg-white/70 hover:shadow-xl group"
          >
            <div className="flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-white/70 border border-white/90 shadow-sm flex items-center justify-center text-3xl shrink-0 group-hover:bg-[#1A1A2E] group-hover:text-white transition-all">
                  🛠️
               </div>
               <div>
                <p className="font-bold text-[#1A1A2E] text-[18px]">{t("dash_all_tools")}</p>
                <p className="text-sm text-gray-500 font-medium">{t("dash_all_tools_desc")}</p>
               </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-xl group-hover:bg-[#1A1A2E] group-hover:text-white transition-all">→</div>
          </Link>
          
          <Link
            href="/settings"
            className="group flex items-center justify-between p-8 rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 transition-all hover:bg-white/70 hover:shadow-xl group"
          >
            <div className="flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-white/70 border border-white/90 shadow-sm flex items-center justify-center text-3xl shrink-0 group-hover:bg-[#1A1A2E] group-hover:text-white transition-all">
                  ⚙️
               </div>
               <div>
                <p className="font-bold text-[#1A1A2E] text-[18px]">{t("dash_settings")}</p>
                <p className="text-sm text-gray-500 font-medium">{t("dash_settings_desc")}</p>
               </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-xl group-hover:bg-[#1A1A2E] group-hover:text-white transition-all">→</div>
          </Link>
      </div>
    </div>
  );

  return (
    <AdminLayoutShell activeHref="/dashboard?tab=overview">
      {OverviewContent}
    </AdminLayoutShell>
  );
}
