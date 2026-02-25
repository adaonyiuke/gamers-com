import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { GroupProvider } from "@/components/providers/group-provider";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <QueryProvider>
        <GroupProvider>
          <div className="min-h-screen bg-[#F2F2F7] relative max-w-[430px] mx-auto">
            {children}
            <BottomNav />
          </div>
        </GroupProvider>
      </QueryProvider>
    </SupabaseProvider>
  );
}
