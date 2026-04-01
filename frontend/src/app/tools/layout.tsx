"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "@/components/GlassUI.module.css";
import { Suspense } from "react";

function GlassShadowingNav() {
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email || "G";
  const userInitial = userName[0].toUpperCase();

  const pathname = usePathname() || "";
  
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        <div className={styles.logoIcon}>まね</div>
        Manebite
      </Link>
      {!pathname.includes("/admin") && (
        <div className={styles.navCenterPills}>
          <Link href="/" className={styles.navPill}>Home</Link>
          <Link href="/tools/shadowing" className={`${styles.navPill} ${pathname.startsWith("/tools/shadowing") ? styles.navPillActive : ""}`}>Shadowing</Link>
          <Link href="/tools/keigo" className={`${styles.navPill} ${pathname.startsWith("/tools/keigo") ? styles.navPillActive : ""}`}>Keigo</Link>
          <Link href="/tools/hongocut" className={`${styles.navPill} ${pathname.startsWith("/tools/hongocut") ? styles.navPillActive : ""}`}>HongoCut</Link>
          <Link href="/tools/goipack" className={`${styles.navPill} ${pathname.startsWith("/tools/goipack") ? styles.navPillActive : ""}`}>Goi Pack</Link>
        </div>
      )}
      <div className={styles.navRight}>
        {session ? (
          <>
            <Link href="/dashboard" className={`${styles.navPill} !px-4 !py-1.5 !text-xs !bg-white/60 hover:!bg-white`}>
              Dashboard
            </Link>
            <div className={styles.navAvatar} title={userName}>{userInitial}</div>
          </>
        ) : (
          <Link href="/login" className={styles.navAvatar} title="Log in">?</Link>
        )}
      </div>
    </nav>
  );
}

export default function ShadowingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Don't show the glass nav and blobs if we are inside a video session
  if (pathname.startsWith("/tools/shadowing/session")) {
    return <>{children}</>;
  }

  const isAdmin = pathname.includes("/admin");

  return (
    <div className={styles.pageWrapper}>
      {/* Blobs */}
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>
      <div className={`${styles.blob} ${styles.blob3}`}></div>
      <div className={`${styles.blob} ${styles.blob4}`}></div>

      {!isAdmin && <GlassShadowingNav />}
      {children}
    </div>
  );
}
