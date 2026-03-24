"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import GroupInviteEmail from "../../../emails/group-invite";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
  toEmail,
  groupId,
}: {
  toEmail: string;
  groupId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Fetch group + invite code
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, invite_code")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return { success: false, error: "Group not found" };
    }

    if (!group.invite_code) {
      return { success: false, error: "This group has no invite code yet" };
    }

    // Get sender's display name from group_members
    const { data: member } = await supabase
      .from("group_members")
      .select("display_name")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    const inviterName = member?.display_name ?? user.email ?? "Someone";
    const inviteUrl = `https://gamenight.clubplay.io/join?code=${group.invite_code}`;

    const { error: sendError } = await resend.emails.send({
      from: "Game Night <noreply@clubplay.io>",
      to: toEmail,
      subject: `${inviterName} invited you to join ${group.name}`,
      react: GroupInviteEmail({
        inviteUrl,
        inviteCode: group.invite_code,
        groupName: group.name,
        inviterName,
      }),
    });

    if (sendError) {
      return { success: false, error: sendError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to send email" };
  }
}
