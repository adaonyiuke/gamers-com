"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./supabase-provider";

interface GroupMembership {
  group_id: string;
  group_name: string;
  role: string;
}

interface GroupContext {
  groupId: string | null;
  loading: boolean;
  groups: GroupMembership[];
  setGroupId: (id: string) => void;
  switchGroup: (id: string) => void;
}

const STORAGE_KEY = "selected_group_id";

const Context = createContext<GroupContext>({
  groupId: null,
  loading: true,
  groups: [],
  setGroupId: () => {},
  switchGroup: () => {},
});

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const switchGroup = useCallback(
    (id: string) => {
      setGroupId(id);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, id);
      }
      // Invalidate all queries so they refetch with the new group
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  useEffect(() => {
    // Wait for Supabase to resolve auth state before acting
    if (authLoading) return;

    if (!user) {
      setGroupId(null);
      setGroups([]);
      setLoading(false);
      // Redirect unauthenticated users to login
      router.push("/login");
      return;
    }

    async function loadGroups() {
      // Fetch all memberships with group names
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, role, groups:group_id(name)")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: true });

      if (memberships && memberships.length > 0) {
        const groupList: GroupMembership[] = memberships.map((m: any) => ({
          group_id: m.group_id,
          group_name: (m.groups as any)?.name ?? "Unknown Group",
          role: m.role,
        }));
        setGroups(groupList);

        // Check localStorage for a previously selected group
        const storedId =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY)
            : null;
        const validStored = groupList.find((g) => g.group_id === storedId);

        setGroupId(validStored ? storedId! : groupList[0].group_id);
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
          setGroups([
            {
              group_id: group.id,
              group_name: group.name,
              role: "owner",
            },
          ]);

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, group.id);
          }

          // Redirect new users to onboarding
          // Check DB (user_metadata) first, fall back to localStorage
          const onboardingDone =
            user!.user_metadata?.onboarding_complete ||
            (typeof window !== "undefined" &&
              localStorage.getItem("onboarding_complete"));
          if (!onboardingDone) {
            router.push("/onboarding");
          }
        }
      }
      setLoading(false);
    }

    loadGroups();
  }, [user, authLoading, supabase, router]);

  return (
    <Context.Provider value={{ groupId, loading, groups, setGroupId, switchGroup }}>
      {children}
    </Context.Provider>
  );
}

export function useGroupId() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useGroupId must be used within a GroupProvider");
  }
  return context;
}
