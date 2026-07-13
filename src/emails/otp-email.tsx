import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OtpEmailProps {
  otp: string;
}

export function OtpEmail({ otp }: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Mã đăng nhập của bạn: {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Lavie Home</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Mã đăng nhập</Heading>
            <Text style={subtitle}>
              Sử dụng mã bên dưới để đăng nhập vào Lavie Home Dashboard.
            </Text>
            <Section style={otpContainer}>
              <Text style={otpCode}>{otp}</Text>
            </Section>
            <Text style={note}>
              Mã có hiệu lực trong <strong>10 phút</strong>.
            </Text>
            <Text style={security}>
              Nếu bạn không yêu cầu mã này, hãy bỏ qua email này. Tài khoản
              của bạn vẫn an toàn.
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Lavie Home. Tất cả quyền được bảo lưu.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "480px",
  overflow: "hidden",
};

const header = {
  backgroundColor: "#18181b",
  padding: "24px 40px",
};

const brand = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
};

const content = {
  padding: "40px 40px 32px",
};

const h1 = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const subtitle = {
  color: "#52525b",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 32px",
};

const otpContainer = {
  backgroundColor: "#f4f4f5",
  borderRadius: "10px",
  margin: "0 0 24px",
  padding: "24px",
  textAlign: "center" as const,
};

const otpCode = {
  color: "#18181b",
  fontSize: "40px",
  fontWeight: "700",
  letterSpacing: "10px",
  margin: "0",
};

const note = {
  color: "#52525b",
  fontSize: "14px",
  margin: "0 0 16px",
};

const security = {
  color: "#a1a1aa",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};

const footer = {
  borderTop: "1px solid #e4e4e7",
  padding: "20px 40px",
};

const footerText = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: "0",
  textAlign: "center" as const,
};
