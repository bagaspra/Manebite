"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/tools/shadowing";

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
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl });
  }

  return (
    <div
      className="w-full max-w-sm rounded-lg px-8 py-10"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}
    >
      <h1
        className="mb-1 text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        Sign In
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
        Welcome back to Manebite
      </p>

      {/* Google */}
      <button
        onClick={handleGoogle}
        className="mb-5 flex w-full items-center justify-center gap-3 rounded border py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-5">
        <hr style={{ borderColor: "var(--border)" }} />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          or
        </span>
      </div>

      {/* Credentials form */}
      <form onSubmit={handleCredentials} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded px-4 py-2.5 text-sm outline-none"
            style={{ background: "#F9F9F7", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded px-4 py-2.5 text-sm outline-none"
            style={{ background: "#F9F9F7", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {error && (
          <p className="rounded px-3 py-2 text-sm" style={{ background: "#FEF2F2", color: "var(--error)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {isLoading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
