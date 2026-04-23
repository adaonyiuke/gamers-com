import {
  Body,
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

interface ReauthenticationEmailProps {
  otpCode: string;
  displayName?: string;
}

export default function ReauthenticationEmail({
  otpCode = "123456",
  displayName = "Player",
}: ReauthenticationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Game Night verification code: {otpCode}</Preview>
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
                Verification code
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
                Hey {displayName}, use the code below to verify your identity
                and continue.
              </Text>

              {/* OTP code */}
              <Section className="text-center my-6">
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: "#F2F2F7",
                    borderRadius: 16,
                    padding: "16px 40px",
                    fontFamily: "monospace",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#161719",
                    letterSpacing: "0.25em",
                  }}
                >
                  {otpCode}
                </div>
              </Section>

              <Text
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  textAlign: "center",
                  marginBottom: 0,
                }}
              >
                This code expires in 10 minutes and can only be used once. If
                you didn&apos;t request this, you can safely ignore this email.
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
                <strong>Security tip:</strong> Never share this code with
                anyone. Game Night staff will never ask for it.
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
