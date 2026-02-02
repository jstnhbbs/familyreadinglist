"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type Mode = "signin" | "register";

export function SignIn() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      setRegisterSuccess(true);
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Account created. Please sign in below.");
        setRegisterSuccess(false);
        return;
      }
      if (signInRes?.ok) window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      if (res?.ok) window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    email.trim() &&
    password &&
    (mode === "signin" ? true : name.trim() && password.length >= 8);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-serif text-xl font-semibold text-amber-900">
        {mode === "signin" ? "Sign in" : "Create an account"}
      </h2>
      {registerSuccess && (
        <p className="mb-3 text-sm text-emerald-600">
          Account created. Signing you in…
        </p>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <form
        onSubmit={mode === "signin" ? handleSignIn : handleRegister}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        {mode === "register" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Your name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="How the group will see you"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder={mode === "register" ? "At least 8 characters" : ""}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 8 : undefined}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "register" : "signin");
              setError("");
            }}
            className="text-sm text-amber-700 hover:underline"
          >
            {mode === "signin"
              ? "Need an account? Register"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
