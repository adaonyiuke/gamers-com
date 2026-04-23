import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  resetUrl: string;
  displayName?: string;
}

export default function ResetPasswordEmail({
  resetUrl = "https://gamenight.clubplay.io/callback?token=example",
  displayName = "Player",
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Game Night password</Preview>
      <Tailwind>
        <Body className="bg-[#F2F2F7] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[480px]">

            {/* App icon */}
            <Section className="text-center mb-6">
              <div
                style={{
                  display: "inline-block",
                  width: 64,
                  height: 64,
                  backgroundColor: "#842AEB",
                  borderRadius: 16,
                  textAlign: "center",
                  lineHeight: "64px",
                  fontSize: 32,
                }}
              >
                🏆
              </div>
            </Section>

            {/* Card */}
            <Section
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                padding: "32px 32px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Heading
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#111111",
                  marginBottom: 8,
                  marginTop: 0,
                  textAlign: "center",
                }}
              >
                Reset your password
              </Heading>

              <Text
                style={{
                  fontSize: 15,
                  color: "#6b7280",
                  lineHeight: "1.6",
                  textAlign: "center",
                  marginTop: 0,
                }}
              >
                Hey {displayName}, we received a request to reset your Game
                Night password. Click the button below to choose a new one.
              </Text>

              <Section className="text-center my-6">
                <Button
                  href={resetUrl}
                  style={{
                    backgroundColor: "#161719",
                    borderRadius: 14,
                    color: "#ffffff",
                    fontSize: 17,
                    fontWeight: 700,
                    textDecoration: "none",
                    padding: "14px 32px",
                    display: "inline-block",
                  }}
                >
                  Reset Password
                </Button>
              </Section>

              <Text
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  textAlign: "center",
                  marginBottom: 0,
                }}
              >
                This link expires in 1 hour. If you didn&apos;t request a
                password reset, you can safely ignore this email — your password
                will not change.
              </Text>
            </Section>

            {/* Security note */}
            <Section
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 16,
                padding: "14px 20px",
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#991b1b",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                <strong>Didn&apos;t request this?</strong> Someone may have
                entered your email by mistake. Your account is still secure —
                no changes have been made.
              </Text>
            </Section>

            {/* Footer */}
            <Hr style={{ borderColor: "#e5e7eb", marginTop: 24 }} />
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                textAlign: "center",
                margin: "12px 0 0",
              }}
            >
              Game Night · Sent from{" "}
              <a href="mailto:noreply@clubplay.io" style={{ color: "#9ca3af" }}>
                noreply@clubplay.io
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
