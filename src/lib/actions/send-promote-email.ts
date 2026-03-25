"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import GuestPromoteEmail from "../../../emails/guest-promote";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPromoteEmail({
  toEmail,
  guestId,
  groupId,
}: {
  toEmail: string;
  guestId: string;
  groupId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Verify current user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Verify user is an owner of this group
    const { data: currentMember } = await supabase
      .from("group_members")
      .select("role, display_name")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!currentMember || currentMember.role !== "owner") {
      return { success: false, error: "Only group owners can promote guests" };
    }

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

    // Fetch guest record
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id, name, promoted_to_user_id")
      .eq("id", guestId)
      .eq("group_id", groupId)
      .single();

    if (guestError || !guest) {
      return { success: false, error: "Guest not found" };
    }

    if (guest.promoted_to_user_id) {
      return { success: false, error: "This guest has already been promoted" };
    }

    const inviterName = currentMember.display_name ?? user.email ?? "Someone";
    const signupUrl = `https://gamenight.clubplay.io/join?code=${group.invite_code}&promote=${guestId}`;

    const { error: sendError } = await resend.emails.send({
      from: "Game Night <noreply@clubplay.io>",
      to: toEmail,
      subject: `${inviterName} wants to make you an official member of ${group.name}`,
      react: GuestPromoteEmail({
        signupUrl,
        guestName: guest.name,
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
