"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface SupabaseContext {
  user: User | null;
  loading: boolean;
}

const Context = createContext<SupabaseContext>({
  user: null,
  loading: true,
});

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <Context.Provider value={{ user, loading }}>{children}</Context.Provider>
  );
}

export function useUser() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useUser must be used within a SupabaseProvider");
  }
  return context;
}
