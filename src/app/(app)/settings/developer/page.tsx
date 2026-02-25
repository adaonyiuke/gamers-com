"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { createClient } from "@/lib/supabase/client";
import {
  SettingsHeader,
  SettingSection,
  SettingRow,
} from "@/components/settings/setting-components";
import { cn } from "@/lib/utils/cn";

export default function DeveloperSettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId } = useGroupId();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExportCSV() {
    if (!groupId) return;
    setExporting(true);
    try {
      const supabase = createClient();

      // Fetch all relevant data
      const [
        { data: members },
        { data: games },
        { data: meetups },
        { data: sessions },
        { data: guests },
      ] = await Promise.all([
        supabase.from("group_members").select("*").eq("group_id", groupId),
        supabase.from("games").select("*").eq("group_id", groupId),
        supabase.from("meetups").select("*").eq("group_id", groupId),
        supabase
          .from("sessions")
          .select("*, meetups!inner(group_id)")
          .eq("meetups.group_id", groupId),
        supabase.from("guests").select("*").eq("group_id", groupId),
      ]);

      const sections = [
        { name: "Members", data: members },
        { name: "Games", data: games },
        { name: "Meetups", data: meetups },
        { name: "Sessions", data: sessions },
        { name: "Guests", data: guests },
      ];

      let csvContent = "";
      for (const section of sections) {
        csvContent += `\n--- ${section.name} ---\n`;
        if (section.data && section.data.length > 0) {
          const headers = Object.keys(section.data[0]);
          csvContent += headers.join(",") + "\n";
          for (const row of section.data) {
            csvContent +=
              headers
                .map((h) => {
                  const val = (row as any)[h];
                  const str = val === null ? "" : String(val);
                  return str.includes(",") ? `"${str}"` : str;
                })
                .join(",") + "\n";
          }
        } else {
          csvContent += "(no data)\n";
        }
      }

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `game-night-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleClearTestData() {
    if (!groupId) return;
    setClearing(true);
    try {
      const supabase = createClient();

      // Delete in dependency order: score_entries → sessions → meetup_participants → meetups → guests → games
      // Get meetup IDs first
      const { data: meetups } = await supabase
        .from("meetups")
        .select("id")
        .eq("group_id", groupId);
      const meetupIds = meetups?.map((m: any) => m.id) ?? [];

      if (meetupIds.length > 0) {
        // Get session IDs
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id")
          .in("meetup_id", meetupIds);
        const sessionIds = sessions?.map((s: any) => s.id) ?? [];

        if (sessionIds.length > 0) {
          await supabase
            .from("score_entries")
            .delete()
            .in("session_id", sessionIds);
          await supabase.from("sessions").delete().in("id", sessionIds);
        }

        await supabase
          .from("meetup_participants")
          .delete()
          .in("meetup_id", meetupIds);
        await supabase.from("meetups").delete().in("id", meetupIds);
      }

      await supabase.from("guests").delete().eq("group_id", groupId);
      await supabase.from("games").delete().eq("group_id", groupId);

      setShowClearConfirm(false);
    } catch (err) {
      console.error("Clear failed:", err);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="pb-36">
      <SettingsHeader title="Developer" onBack={() => router.back()} />

      <div className="px-5 mt-4 space-y-5">
        {/* ── Data ──────────────────────────────────────────────── */}
        <SettingSection title="Data">
          <SettingRow
            label="Seed Demo Data"
            description="Populate with sample games, meetups & scores"
            icon={
              <div className="h-9 w-9 rounded-[10px] bg-indigo-100 flex items-center justify-center">
                <Database className="h-[18px] w-[18px] text-indigo-600" />
              </div>
            }
            onClick={() => router.push("/seed")}
          />
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-gray-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-[10px] bg-green-100 flex items-center justify-center shrink-0">
              {exporting ? (
                <Loader2 className="h-[18px] w-[18px] text-green-600 animate-spin" />
              ) : (
                <Download className="h-[18px] w-[18px] text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-gray-900">
                {exporting ? "Exporting..." : "Export Data (CSV)"}
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Download all group data as a spreadsheet
              </p>
            </div>
          </button>
        </SettingSection>

        {/* ── Danger Zone ───────────────────────────────────────── */}
        <SettingSection title="Danger Zone">
          {showClearConfirm ? (
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[17px] font-semibold text-red-600">
                    Clear all test data?
                  </p>
                  <p className="text-[14px] text-gray-500 mt-1">
                    This will permanently delete all games, meetups, sessions,
                    scores, and guests in this group. Members will not be
                    removed. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearTestData}
                  disabled={clearing}
                  className={cn(
                    "flex-1 bg-red-500 text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                    clearing && "opacity-50"
                  )}
                >
                  {clearing ? "Clearing..." : "Clear All Data"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-red-50 transition-colors"
            >
              <div className="h-9 w-9 rounded-[10px] bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-[18px] w-[18px] text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] text-red-500">Clear Test Data</p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Remove all games, meetups, sessions & guests
                </p>
              </div>
            </button>
          )}
        </SettingSection>
      </div>
    </div>
  );
}
