"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm your account!");
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
            Create Account
          </h1>
          <p className="text-gray-500 text-[15px] mt-1">
            Join your game night crew
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="bg-white rounded-[14px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              required
              className="w-full px-4 py-3.5 text-[17px] outline-none border-b border-gray-100"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3.5 text-[17px] outline-none border-b border-gray-100"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full px-4 py-3.5 text-[17px] outline-none"
            />
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
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-[15px] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#007AFF] font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
