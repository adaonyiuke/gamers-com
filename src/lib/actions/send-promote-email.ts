"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import GuestPromoteEmail from "../../../emails/guest-promote";

const resend = new Resend(process.env.RESEND_API_KEY);

// Max promote emails per group per hour
const PROMOTE_RATE_LIMIT = 10;
// Minimum seconds between re-sending for the same guest
const RESEND_COOLDOWN_SECONDS = 300; // 5 minutes

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
      .select("id, name, promoted_to_user_id, promote_email, promote_email_sent_at")
      .eq("id", guestId)
      .eq("group_id", groupId)
      .single();

    if (guestError || !guest) {
      return { success: false, error: "Guest not found" };
    }

    if (guest.promoted_to_user_id) {
      return { success: false, error: "This guest has already been promoted" };
    }

    // GAM-40: Prevent re-sending too quickly for the same guest
    if (guest.promote_email_sent_at) {
      const sentAt = new Date(guest.promote_email_sent_at).getTime();
      const elapsed = (Date.now() - sentAt) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
        return {
          success: false,
          error: `A promote email was recently sent. Please wait ${remaining} seconds before resending.`,
        };
      }
    }

    // GAM-40: Prevent changing the target email once set (avoid race condition
    // where two people could claim the same guest)
    if (guest.promote_email && guest.promote_email.toLowerCase() !== toEmail.toLowerCase()) {
      return {
        success: false,
        error: "A promote email was already sent to a different address for this guest.",
      };
    }

    // GAM-40: Per-group hourly rate limit
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count: recentCount } = await supabase
      .from("guests")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .not("promote_email_sent_at", "is", null)
      .gte("promote_email_sent_at", oneHourAgo);

    if ((recentCount ?? 0) >= PROMOTE_RATE_LIMIT) {
      return {
        success: false,
        error: "Too many promote emails sent recently. Please try again later.",
      };
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

    // GAM-42: Store intended email + timestamp on guest record
    await supabase
      .from("guests")
      .update({
        promote_email: toEmail.toLowerCase(),
        promote_email_sent_at: new Date().toISOString(),
      })
      .eq("id", guestId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to send email" };
  }
}
