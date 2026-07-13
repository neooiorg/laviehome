import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  url: string;
}

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <Html lang="vi">
      <Head />
      <Preview>Đăng nhập vào Lavie Home Dashboard</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={brand}>Lavie Home</Heading>
            <Text style={tagline}>Dashboard Admin</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>Xin chào!</Heading>
            <Text style={paragraph}>
              Bạn đã yêu cầu đăng nhập vào <strong>Lavie Home Dashboard</strong>.
              Nhấn vào nút bên dưới để đăng nhập ngay.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={url}>
                Đăng nhập ngay
              </Button>
            </Section>

            <Text style={expiry}>
              Link có hiệu lực trong <strong>15 phút</strong>.
            </Text>

            <Hr style={divider} />

            <Text style={securityNote}>
              Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.
            </Text>

            <Text style={linkFallback}>
              Hoặc dán link này vào trình duyệt:{" "}
              <a href={url} style={linkStyle}>
                {url}
              </a>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Lavie Home · Tự Check-in 24/7
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default MagicLinkEmail;

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "520px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const header: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "32px 40px 28px",
  textAlign: "center",
};

const brand: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0 0 4px",
};

const tagline: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  fontWeight: "500",
  letterSpacing: "1px",
  margin: 0,
  textTransform: "uppercase",
};

const content: React.CSSProperties = {
  padding: "40px 40px 32px",
};

const heading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#52525b",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 28px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 32px",
  textDecoration: "none",
  letterSpacing: "-0.1px",
};

const expiry: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: "0 0 24px",
  textAlign: "center",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "0 0 20px",
};

const securityNote: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const linkFallback: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
  wordBreak: "break-all",
};

const linkStyle: React.CSSProperties = {
  color: "#18181b",
};

const footer: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderTop: "1px solid #e4e4e7",
  padding: "20px 40px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: 0,
};
