"use client";

import { Suspense, useEffect, useState } from "react";
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
        // Not logged in - redirect to signup with the invite code
        router.replace(`/signup?code=${code}`);
        return;
      }

      setStatus("joining");

      // Look up the group by invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("invite_code", code!)
        .single();

      if (groupError || !group) {
        setErrorMessage("Invalid or expired invite code.");
        setStatus("error");
        return;
      }

      setGroupName(group.name);

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        // Already a member, just redirect
        router.replace("/dashboard");
        return;
      }

      // Join the group
      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Member";

      const { error: joinError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "member",
          display_name: displayName,
        });

      if (joinError) {
        setErrorMessage("Failed to join group. Please try again.");
        setStatus("error");
        return;
      }

      // Success - redirect to dashboard
      router.replace("/dashboard");
    }

    handleJoin();
  }, [code, router]);

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
