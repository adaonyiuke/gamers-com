"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const router = useRouter();
  const supabase = createClient();

  // Read optional redirect param (used by promotion flow, etc.)
  const redirectTo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")
      : null;

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo ?? "/dashboard");
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const callbackUrl = redirectTo
      ? `${window.location.origin}/callback?next=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a login link!");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/app-icon.png"
            alt="Game Night"
            width={72}
            height={72}
            className="rounded-[16px] mx-auto mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
            priority
          />
          <h1 className="text-[28px] font-bold text-black tracking-tight">
            Game Night
          </h1>
          <p className="text-gray-500 text-[15px] mt-1">
            Track your game nights
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex mb-6 bg-gray-200/80 rounded-[10px] p-[3px]">
          <button
            onClick={() => setMode("password")}
            className={`flex-1 py-[7px] text-[13px] font-semibold rounded-[8px] transition-all ${
              mode === "password"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setMode("magic")}
            className={`flex-1 py-[7px] text-[13px] font-semibold rounded-[8px] transition-all ${
              mode === "magic"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500"
            }`}
          >
            Magic Link
          </button>
        </div>

        <form
          onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
          className="space-y-4"
        >
          <div className="bg-white rounded-[14px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3.5 text-[17px] outline-none border-b border-gray-100"
            />
            {mode === "password" && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3.5 text-[17px] outline-none"
              />
            )}
          </div>

          {message && (
            <p
              className={`text-[14px] text-center ${
                message.includes("Check your email")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {loading
              ? "..."
              : mode === "password"
                ? "Sign In"
                : "Send Magic Link"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-[15px] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#007AFF] font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
