"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center mx-auto mb-6">
          <Loader2 className="h-8 w-8 text-[#007AFF] animate-spin" />
        </div>
        <p className="text-[17px] text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const promoteFromUrl = searchParams.get("promote");

  // Recover promote guest ID from localStorage if not in URL
  // (Supabase email confirmation redirects can lose query params)
  const promoteGuestId = useMemo(() => {
    if (promoteFromUrl) {
      // Store in localStorage as backup for redirect chain
      if (typeof window !== "undefined" && code) {
        localStorage.setItem("promote_guest_id", promoteFromUrl);
        localStorage.setItem("promote_invite_code", code);
      }
      return promoteFromUrl;
    }
    // Try to recover from localStorage
    if (typeof window !== "undefined" && code) {
      const storedCode = localStorage.getItem("promote_invite_code");
      if (storedCode && storedCode.toUpperCase() === code.toUpperCase()) {
        return localStorage.getItem("promote_guest_id");
      }
    }
    return null;
  }, [promoteFromUrl, code]);

  const [status, setStatus] = useState<
    "loading" | "joining" | "error" | "no-code"
  >("loading");
  const [groupName, setGroupName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("no-code");
      return;
    }

    async function handleJoin() {
      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in - redirect to signup with the invite code (+ promote param if present)
        const signupParams = new URLSearchParams({ code: code! });
        if (promoteGuestId) signupParams.set("promote", promoteGuestId);
        router.replace(`/signup?${signupParams.toString()}`);
        return;
      }

      setStatus("joining");

      // Determine display name
      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Member";

      // Use SECURITY DEFINER RPC to join the group (bypasses RLS)
      // This handles: group lookup, membership check, insert, and guest promotion
      const { data, error: rpcError } = await supabase.rpc(
        "join_group_by_invite_code",
        {
          invite_code: code!.trim().toUpperCase(),
          p_display_name: displayName,
          p_promote_guest_id: promoteGuestId || null,
        }
      );

      if (rpcError) {
        setErrorMessage("Failed to join group. Please try again.");
        setStatus("error");
        return;
      }

      // The RPC returns a jsonb object with error or success info
      if (data?.error) {
        setErrorMessage(data.error);
        setStatus("error");
        return;
      }

      setGroupName(data.group_name ?? "");

      // Store joined group so GroupProvider picks it up
      if (typeof window !== "undefined" && data.group_id) {
        localStorage.setItem("selected_group_id", data.group_id);
        // Clean up promote localStorage entries
        localStorage.removeItem("promote_guest_id");
        localStorage.removeItem("promote_invite_code");
      }

      // Success - redirect to dashboard
      router.replace("/dashboard");
    }

    handleJoin();
  }, [code, router, promoteGuestId]);

  if (status === "no-code") {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 mb-2">
            Missing Invite Code
          </h1>
          <p className="text-[15px] text-gray-500 mb-8">
            This invite link appears to be invalid. Ask your friend to send you
            a new one.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[#007AFF] text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 mb-2">
            Unable to Join
          </h1>
          <p className="text-[15px] text-gray-500 mb-8">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#007AFF] text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gray-100 text-gray-900 rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading / Joining state
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center mx-auto mb-6">
          <UserPlus className="h-8 w-8 text-[#007AFF]" />
        </div>
        {groupName ? (
          <>
            <h1 className="text-[22px] font-bold text-gray-900 mb-2">
              Joining {groupName}
            </h1>
            <p className="text-[15px] text-gray-500 mb-6">
              Setting up your membership...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[22px] font-bold text-gray-900 mb-2">
              Joining...
            </h1>
            <p className="text-[15px] text-gray-500 mb-6">
              Looking up your invite...
            </p>
          </>
        )}
        <Loader2 className="h-6 w-6 text-[#007AFF] animate-spin mx-auto" />
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <JoinContent />
    </Suspense>
  );
}
