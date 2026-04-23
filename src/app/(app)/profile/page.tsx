"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupId } from "@/components/providers/group-provider";
import { useGroupMembers } from "@/lib/queries/members";

export default function ProfileRedirect() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId } = useGroupId();
  const { data: members } = useGroupMembers(groupId);

  const currentMemberId = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m: any) => m.user_id === user.id)?.id ?? null;
  }, [members, user]);

  useEffect(() => {
    if (currentMemberId) {
      router.replace(`/profiles/${currentMemberId}`);
    }
  }, [currentMemberId, router]);

  return null;
}
