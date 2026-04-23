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

interface ChangeEmailProps {
  confirmationUrl: string;
  newEmail?: string;
  displayName?: string;
}

export default function ChangeEmailEmail({
  confirmationUrl = "https://gamenight.clubplay.io/callback?token=example",
  newEmail = "new@example.com",
  displayName = "Player",
}: ChangeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your new email address for Game Night</Preview>
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
                Confirm your new email
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
                Hey {displayName}, you requested to change your Game Night email
                address to:
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111111",
                  textAlign: "center",
                  margin: "0 0 16px",
                }}
              >
                {newEmail}
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  color: "#6b7280",
                  lineHeight: "1.6",
                  textAlign: "center",
                  marginTop: 0,
                }}
              >
                Click the button below to confirm this change.
              </Text>

              <Section className="text-center my-6">
                <Button
                  href={confirmationUrl}
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
                  Confirm New Email
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
                This link expires in 24 hours. If you didn&apos;t request this
                change, you can safely ignore this email — your current address
                will remain active.
              </Text>
            </Section>

            {/* Warning note */}
            <Section
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 16,
                padding: "14px 20px",
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#92400e",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                <strong>Didn&apos;t request this?</strong> If you didn&apos;t
                ask to change your email, please secure your account immediately
                by resetting your password.
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
