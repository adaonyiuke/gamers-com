"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupId } from "@/components/providers/group-provider";
import { createClient } from "@/lib/supabase/client";

export default function ProfileRedirect() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId } = useGroupId();

  useEffect(() => {
    if (!user || !groupId) return;

    const supabase = createClient();

    async function redirect() {
      const { data } = await supabase
        .from("group_members")
        .select("id, group_id")
        .eq("user_id", user!.id);

      if (!data?.length) {
        router.replace("/settings");
        return;
      }

      // Prefer the record in the currently selected group
      const inCurrentGroup = data.find((m) => m.group_id === groupId);
      const member = inCurrentGroup ?? data[0];
      router.replace(`/profiles/${member.id}`);
    }

    redirect();
  }, [user, groupId, router]);

  return null;
}
