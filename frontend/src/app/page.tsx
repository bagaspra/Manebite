"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "@/components/GlassUI.module.css";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className={styles.pageWrapper}>
      {/* Blobs */}
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>
      <div className={`${styles.blob} ${styles.blob3}`}></div>
      <div className={`${styles.blob} ${styles.blob4}`}></div>

      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>まね</div>
          Manebite
        </Link>
        {/* Removed navCenter as requested */}
        <div className={styles.navRight}>
          {session ? (
            <Link href="/dashboard" className={styles.btnNavDark}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={styles.btnNavOutline}>
                Log in
              </Link>
              <Link href="/register" className={styles.btnNavDark}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* SUBNAV */}
      <div className={styles.subnavWrap}>
        <div className={styles.subnavPills}>
          <Link href="/" className={`${styles.snpill} ${styles.snpillActive}`}>All Tools</Link>
          <Link href="/tools/shadowing" className={styles.snpill}>Shadowing</Link>
          <Link href="/tools/keigo" className={styles.snpill}>Keigo</Link>
          <Link href="/tools/hongocut" className={styles.snpill}>HongoCut</Link>
          <Link href="/tools/goipack" className={styles.snpill}>Goi Pack</Link>
        </div>
      </div>

      {/* MAIN GLASS SECTION */}
      <div className={styles.mainSection}>
        <div className={styles.cardsGrid}>

          <Link href="/tools/shadowing" className={`${styles.toolCard} ${styles.cardShadowing}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardIcons}>
                <div className={styles.iconBox}>🎧</div>
                <div className={styles.iconBox}>〜</div>
              </div>
              <div className={styles.cardArrow}>→</div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>Shadowing Queue</div>
              <div className={styles.cardDesc}>Shadow YouTube videos sentence by sentence with Loop, Follow, and Step modes</div>
              <span className={`${styles.cardBadge} ${styles.badgeActive}`}><span className={styles.badgeDot}></span>Active</span>
            </div>
          </Link>

          <Link href="/tools/keigo" className={`${styles.toolCard} ${styles.cardKeigo}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardIcons}>
                <div className={styles.iconBox}>敬</div>
                <div className={styles.iconBox}>✉</div>
              </div>
              <div className={styles.cardArrow}>→</div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>Keigo Translator</div>
              <div className={styles.cardDesc}>Convert casual Japanese to formal business speech using AI</div>
              <span className={`${styles.cardBadge} ${styles.badgeActive}`}><span className={styles.badgeDot}></span>Active</span>
            </div>
          </Link>

          <Link href="/tools/hongocut" className={`${styles.toolCard} ${styles.cardHongocut}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardIcons}>
                <div className={styles.iconBox}>✂</div>
                <div className={styles.iconBox}>▶</div>
              </div>
              <div className={styles.cardArrow}>→</div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>HongoCut</div>
              <div className={styles.cardDesc}>Search any Japanese word and watch real clips of native speakers using it</div>
              <span className={`${styles.cardBadge} ${styles.badgeNew}`}><span className={styles.badgeDot}></span>New</span>
            </div>
          </Link>

          <Link href="/tools/goipack" className={`${styles.toolCard} ${styles.cardGoipack}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardIcons}>
                <div className={styles.iconBox}>語</div>
                <div className={styles.iconBox}>📚</div>
              </div>
              <div className={styles.cardArrow}>→</div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>Goi Pack</div>
              <div className={styles.cardDesc}>Curated vocabulary packs by topic, JLPT level, and real-world context</div>
              <span className={`${styles.cardBadge} ${styles.badgeNew}`}><span className={styles.badgeDot}></span>New</span>
            </div>
          </Link>

        </div>
      </div>

      {/* FOOTER */}
      <footer className={styles.footerWrap}>
        <div className={styles.footerLeft}>
          <div className={styles.footerLogo}>まね</div>
          <span className={styles.footerText}>© Manebite 2026. All rights reserved.</span>
        </div>
        <div className={styles.footerLinks}>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms</Link>
        </div>
        <div className={styles.footerSocials}>
          <span>𝕏</span>
          <span>⬡</span>
          <span>◎</span>
        </div>
      </footer>
    </div>
  );
}
