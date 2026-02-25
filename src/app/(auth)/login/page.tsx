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
          <div className="w-16 h-16 rounded-[16px] overflow-hidden mx-auto mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
            <Image
              src="/icon-192.png"
              alt="Game Night HQ"
              width={192}
              height={192}
              className="w-full h-full object-cover scale-[1.25]"
              priority
            />
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
