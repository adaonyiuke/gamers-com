"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./supabase-provider";

interface GroupContext {
  groupId: string | null;
  loading: boolean;
}

const Context = createContext<GroupContext>({
  groupId: null,
  loading: true,
});

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setGroupId(null);
      setLoading(false);
      return;
    }

    async function loadGroup() {
      // Find the user's first group
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user!.id)
        .limit(1);

      if (memberships && memberships.length > 0) {
        setGroupId(memberships[0].group_id);
      } else {
        // Auto-create a group for new users
        const displayName =
          user!.user_metadata?.display_name ||
          user!.email?.split("@")[0] ||
          "User";

        const { data: group } = await supabase
          .from("groups")
          .insert({
            name: `${displayName}'s Game Night`,
            created_by: user!.id,
          })
          .select()
          .single();

        if (group) {
          await supabase.from("group_members").insert({
            group_id: group.id,
            user_id: user!.id,
            display_name: displayName,
            role: "owner",
          });
          setGroupId(group.id);

          // Redirect new users to onboarding
          if (typeof window !== "undefined" && !localStorage.getItem("onboarding_complete")) {
            router.push("/onboarding");
          }
        }
      }
      setLoading(false);
    }

    loadGroup();
  }, [user, supabase]);

  return (
    <Context.Provider value={{ groupId, loading }}>{children}</Context.Provider>
  );
}

export function useGroupId() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useGroupId must be used within a GroupProvider");
  }
  return context;
}
