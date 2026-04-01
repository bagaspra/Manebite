"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import styles from "@/components/GlassUI.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setIsLoading(false);
    if (result?.error) {
      setError("Email atau kata sandi tidak valid.");
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="w-full max-w-sm animate-fadeUp">
      <div className="rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 p-8 shadow-2xl shadow-emerald-500/5">
        {/* Google */}
        <button
          onClick={handleGoogle}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/80 bg-white/60 py-3 text-sm font-bold text-[#1A1A2E] shadow-sm transition-all hover:bg-white/90 hover:scale-[1.01] active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Gunakan Google
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/60"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/10 px-2 font-bold tracking-widest text-gray-400 backdrop-blur-sm">Atau</span>
          </div>
        </div>

        {/* Credentials form */}
        <form onSubmit={handleCredentials} className="space-y-5">
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={`${styles.urlInput} w-full shadow-inner !rounded-xl !py-3 !px-4`}
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${styles.urlInput} w-full shadow-inner !rounded-xl !py-3 !px-4`}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-100/80 px-4 py-2 text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#1A1A2E] py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#2d2d48] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? "Masuk..." : "Masuk ke Manebite"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
            Daftar Gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* Blobs for glass effect background */}
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>
      <div className={`${styles.blob} ${styles.blob3}`}></div>
      <div className={`${styles.blob} ${styles.blob4}`}></div>

      <main className="flex min-h-screen items-center justify-center px-4 py-12 relative z-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
