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

  // Flow 1: PKCE code exchange (password sign-in, OAuth)
  const code = searchParams.get("code");
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
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
      return NextResponse.redirect(`${origin}${next}`);
    }
    const message = encodeURIComponent(verifyError.message);
    return NextResponse.redirect(`${origin}/login?error=${message}`);
  }

  // No auth params found
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Invalid verification link")}`
  );
}
