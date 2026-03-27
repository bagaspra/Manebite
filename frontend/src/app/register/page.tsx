"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

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
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
        throw new Error(body.detail ?? "Registration failed.");
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registered successfully, but sign-in failed. Please log in manually.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle = {
    background: "#F9F9F7",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };
  const labelStyle = {
    color: "var(--text-secondary)",
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-sm rounded-lg px-8 py-10"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        }}
      >
        <h1 className="mb-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Create Account
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
          Start your Japanese shadowing journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={labelStyle}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full rounded px-4 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={labelStyle}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded px-4 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={labelStyle}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded px-4 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={labelStyle}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded px-4 py-2.5 text-sm outline-none"
              style={inputStyle}
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
            {isLoading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
