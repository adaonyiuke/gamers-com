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

interface GuestPromoteEmailProps {
  signupUrl: string;
  guestName: string;
  groupName: string;
  inviterName: string;
}

export default function GuestPromoteEmail({
  signupUrl = "https://gamenight.clubplay.io/signup?code=ABC123&promote=xyz",
  guestName = "Jordan",
  groupName = "Friday Night Games",
  inviterName = "Alex",
}: GuestPromoteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} wants to make you an official member of {groupName}
      </Preview>
      <Tailwind>
        <Body className="bg-[#F2F2F7] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[480px]">

            {/* Hero banner */}
            <Section
              style={{
                background: "linear-gradient(160deg, #0a2540 0%, #3F48EB 100%)",
                borderRadius: 24,
                padding: "32px 32px 28px",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 12,
                  lineHeight: 1,
                }}
              >
                🎉
              </div>
              <Heading
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#ffffff",
                  margin: "0 0 8px",
                  lineHeight: "1.2",
                }}
              >
                You&apos;re going official!
              </Heading>
              <Text
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.7)",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {inviterName} is promoting {guestName} to a full member of
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#EBC31C",
                  margin: "4px 0 0",
                }}
              >
                {groupName}
              </Text>
            </Section>

            {/* Card */}
            <Section
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                padding: "28px 32px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: "#6b7280",
                  lineHeight: "1.6",
                  textAlign: "center",
                  marginTop: 0,
                }}
              >
                Create an account to claim your game history &mdash; all your
                past scores, wins, and stats will carry over to your new profile.
              </Text>

              <Section className="text-center my-5">
                <Button
                  href={signupUrl}
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
                  Claim Your Account
                </Button>
              </Section>

              <Text
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  textAlign: "center",
                  margin: "16px 0 0",
                }}
              >
                This link is for {guestName} only. If you weren&apos;t
                expecting this, you can ignore it.
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
              Game Night HQ &middot; Sent from{" "}
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
