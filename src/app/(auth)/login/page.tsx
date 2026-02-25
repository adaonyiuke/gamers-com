"use client";

import { useState } from "react";
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
      router.push("/dashboard");
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
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
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z" />
              <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z" />
              <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134 0Z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-black tracking-tight">
            Game Night HQ
          </h1>
          <p className="text-gray-500 text-[15px] mt-1">
            Track your game nights
          </p>
        </div>

        {/* Segmented Control */}
        <div
          className="flex mb-6 p-0.5 rounded-[9px]"
          style={{ background: "rgba(118, 118, 128, 0.12)" }}
        >
          <button
            onClick={() => setMode("password")}
            className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] transition-all ${
              mode === "password"
                ? "bg-white shadow-sm font-semibold text-black"
                : "text-gray-600"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setMode("magic")}
            className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] transition-all ${
              mode === "magic"
                ? "bg-white shadow-sm font-semibold text-black"
                : "text-gray-600"
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
