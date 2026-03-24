import { render } from "@react-email/components";
import { createElement } from "react";
import { writeFileSync, mkdirSync } from "fs";

async function main() {
  const { default: ConfirmAccountEmail } = await import("../emails/confirm-account");
  const { default: MagicLinkEmail } = await import("../emails/magic-link");
  const { default: GroupInviteEmail } = await import("../emails/group-invite");
  const { default: ChangeEmailEmail } = await import("../emails/change-email");
  const { default: ResetPasswordEmail } = await import("../emails/reset-password");
  const { default: ReauthenticationEmail } = await import("../emails/reauthentication");

  mkdirSync("emails/rendered", { recursive: true });

  // Confirm account
  writeFileSync("emails/rendered/confirm-account.html", await render(
    createElement(ConfirmAccountEmail, {
      confirmationUrl: "{{ .ConfirmationURL }}",
      displayName: "{{ .Data.display_name }}",
    })
  ));
  console.log("✓ confirm-account.html");

  // Magic link
  writeFileSync("emails/rendered/magic-link.html", await render(
    createElement(MagicLinkEmail, {
      magicLinkUrl: "{{ .ConfirmationURL }}",
      displayName: "{{ .Data.display_name }}",
    })
  ));
  console.log("✓ magic-link.html");

  // Change email
  writeFileSync("emails/rendered/change-email.html", await render(
    createElement(ChangeEmailEmail, {
      confirmationUrl: "{{ .ConfirmationURL }}",
      newEmail: "{{ .NewEmail }}",
      displayName: "{{ .Data.display_name }}",
    })
  ));
  console.log("✓ change-email.html");

  // Reset password
  writeFileSync("emails/rendered/reset-password.html", await render(
    createElement(ResetPasswordEmail, {
      resetUrl: "{{ .ConfirmationURL }}",
      displayName: "{{ .Data.display_name }}",
    })
  ));
  console.log("✓ reset-password.html");

  // Reauthentication (OTP code)
  writeFileSync("emails/rendered/reauthentication.html", await render(
    createElement(ReauthenticationEmail, {
      otpCode: "{{ .Token }}",
      displayName: "{{ .Data.display_name }}",
    })
  ));
  console.log("✓ reauthentication.html");

  // Group invite (sent via Resend directly, no Supabase template)
  writeFileSync("emails/rendered/group-invite.html", await render(
    createElement(GroupInviteEmail, {
      inviteUrl: "https://gamenight.clubplay.io/join?code=ABC123",
      inviteCode: "ABC123",
      groupName: "Friday Night Games",
      inviterName: "Alex",
    })
  ));
  console.log("✓ group-invite.html");

  console.log("\nAll emails rendered to emails/rendered/");
}

main().catch(console.error);
