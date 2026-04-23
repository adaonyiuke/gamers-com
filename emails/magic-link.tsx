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

interface MagicLinkEmailProps {
  magicLinkUrl: string;
  displayName?: string;
}

export default function MagicLinkEmail({
  magicLinkUrl = "https://gamenight.clubplay.io/callback?token=example",
  displayName = "Player",
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Game Night sign-in link</Preview>
      <Tailwind>
        <Body className="bg-[#F2F2F7] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[480px]">

            {/* Logo / App icon area */}
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
                Your sign-in link
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
                Hey {displayName}! Click the button below to sign in to Game
                Night. This link is single-use and expires in 1 hour.
              </Text>

              <Section className="text-center my-6">
                <Button
                  href={magicLinkUrl}
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
                  Sign In to Game Night
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
                If you didn&apos;t request this link, you can safely ignore
                this email. Your account is secure.
              </Text>
            </Section>

            {/* Security note */}
            <Section
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 16,
                padding: "14px 20px",
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#166534",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                <strong>Security tip:</strong> Game Night will never ask for
                your password. This link is only valid for one sign-in.
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
