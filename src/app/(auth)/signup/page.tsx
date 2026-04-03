"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Resend state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const supabase = createClient();
  const searchParams = useSearchParams();

  const loginHref = useMemo(() => {
    const code = searchParams.get("code");
    const promote = searchParams.get("promote");
    if (code) {
      let joinPath = `/join?code=${code}`;
      if (promote) joinPath += `&promote=${promote}`;
      return `/login?redirect=${encodeURIComponent(joinPath)}`;
    }
    return "/login";
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function buildRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("code");
    const promoteGuestId = params.get("promote");

    let callbackNext = "";
    if (inviteCode) {
      let joinPath = `/join?code=${inviteCode}`;
      if (promoteGuestId) joinPath += `&promote=${promoteGuestId}`;
      callbackNext = `?next=${encodeURIComponent(joinPath)}`;
    }
    return `${window.location.origin}/callback${callbackNext}`;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildRedirectUrl(),
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setConfirmed(true);
      setResendCooldown(60);
    }
    setLoading(false);
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendMessage("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: buildRedirectUrl(),
      },
    });

    if (error) {
      setResendMessage("Couldn't resend. Please try again.");
    } else {
      setResendMessage("Sent! Check your inbox.");
      setResendCooldown(60);
    }
    setResendLoading(false);
  }

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-[#161719] rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
            <Mail className="h-7 w-7 text-white" />
          </div>

          <h1 className="text-[28px] font-bold text-black tracking-tight mb-2">
            Check your inbox
          </h1>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            We sent a confirmation link to
          </p>
          <p className="text-[15px] font-semibold text-gray-900 mt-0.5 mb-6">
            {email}
          </p>

          {/* Spam hint */}
          <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-4 py-3.5 mb-5 text-left">
            <p className="text-[13px] text-amber-800 leading-snug">
              <span className="font-semibold">Can&apos;t find it?</span> Check
              your spam or junk folder — confirmation emails sometimes end up
              there.
            </p>
          </div>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="w-full bg-white border border-gray-200 rounded-[14px] py-4 text-[17px] font-semibold text-gray-900 disabled:opacity-50 active:scale-[0.98] transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3"
          >
            {resendLoading
              ? "Sending..."
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend confirmation email"}
          </button>

          {resendMessage && (
            <p
              className={`text-[13px] mb-4 ${
                resendMessage.includes("Sent")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {resendMessage}
            </p>
          )}

          <button
            onClick={() => {
              setConfirmed(false);
              setError("");
              setResendMessage("");
            }}
            className="text-[15px] text-gray-400 font-medium"
          >
            Wrong email? Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Signup form ──────────────────────────────────────────────────────────
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

          {error && (
            <p className="text-[14px] text-center text-red-500">{error}</p>
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
          <Link href={loginHref} className="text-[#007AFF] font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
