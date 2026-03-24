import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";

interface ConfirmAccountEmailProps {
  confirmationUrl: string;
  displayName?: string;
}

export default function ConfirmAccountEmail({
  confirmationUrl = "https://gamenight.clubplay.io/callback?token=example",
  displayName = "Player",
}: ConfirmAccountEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your Game Night account</Preview>
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
                  backgroundColor: "#161719",
                  borderRadius: 16,
                  textAlign: "center",
                  lineHeight: "64px",
                  fontSize: 32,
                }}
              >
                🎲
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
                Confirm your account
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
                Hey {displayName}, welcome to Game Night! Click the button
                below to verify your email address and get started.
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
                  Confirm Email
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
                This link expires in 24 hours. If you didn&apos;t sign up for
                Game Night, you can safely ignore this email.
              </Text>
            </Section>

            {/* Spam tip */}
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
                <strong>Tip:</strong> Add{" "}
                <span style={{ color: "#b45309" }}>noreply@clubplay.io</span> to
                your contacts so future emails land in your inbox.
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
              Game Night HQ · Sent from{" "}
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
