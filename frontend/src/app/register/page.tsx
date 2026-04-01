"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import styles from "@/components/GlassUI.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi harus minimal 8 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail ?? "Pendaftaran gagal.");
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Berhasil daftar, tapi gagal masuk otomatis. Silakan masuk secara manual.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Blobs for glass effect background */}
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>
      <div className={`${styles.blob} ${styles.blob3}`}></div>
      <div className={`${styles.blob} ${styles.blob4}`}></div>

      <main className="flex min-h-screen items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-sm animate-fadeUp">
          <div className="rounded-3xl bg-white/45 backdrop-blur-xl border border-white/80 p-8 shadow-2xl shadow-emerald-500/5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={`${styles.urlInput} w-full shadow-inner !rounded-xl !py-2.5 !px-4`}
                  placeholder="Nama Kamu"
                  required
                />
              </div>

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
                  className={`${styles.urlInput} w-full shadow-inner !rounded-xl !py-2.5 !px-4`}
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
                  autoComplete="new-password"
                  className={`${styles.urlInput} w-full shadow-inner !rounded-xl !py-2.5 !px-4`}
                  placeholder="Minimal 8 karakter"
                />
              </div>

              <div className="space-y-2">
                <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Konfirmasi Sandi
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`${styles.urlInput} w-full shadow-inner !rounded-xl !py-2.5 !px-4`}
                  placeholder="Ulangi kata sandi"
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
                {isLoading ? "Mendaftarkan…" : "Buat Akun Sekarang"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-gray-500">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
                Masuk Saja
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
