import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Prevent open redirect — only allow relative paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  // Handle error params (Supabase redirects with these on failure)
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (error) {
    const message = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(`${origin}/login?error=${message}`);
  }

  const supabase = await createClient();

  // Redirect helper: checks if user needs onboarding before landing
  async function resolveRedirect() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return next;

    // If the user has a specific destination (e.g. /join), honour it
    if (next !== "/dashboard") return next;

    // Check if user has any group memberships — if not, they're new
    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!count || count === 0) return "/onboarding";

    // Existing user with groups — check onboarding status
    const onboardingDone = user.user_metadata?.onboarding_complete;
    if (!onboardingDone) return "/onboarding";

    return next;
  }

  // Flow 1: PKCE code exchange (password sign-in, OAuth)
  const code = searchParams.get("code");
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      const destination = await resolveRedirect();
      return NextResponse.redirect(`${origin}${destination}`);
    }
    const message = encodeURIComponent(exchangeError.message);
    return NextResponse.redirect(`${origin}/login?error=${message}`);
  }

  // Flow 2: Email OTP verification (sign-up confirmation, magic link)
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!verifyError) {
      const destination = await resolveRedirect();
      return NextResponse.redirect(`${origin}${destination}`);
    }
    const message = encodeURIComponent(verifyError.message);
    return NextResponse.redirect(`${origin}/login?error=${message}`);
  }

  // No auth params found
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Invalid verification link")}`
  );
}
