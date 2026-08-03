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
} from "@react-email/components";
import type { ReactNode } from "react";

type BookingConfirmationEmailProps = {
  bookingId: string;
  customerName?: string | null;
  roomName?: string | null;
  branchName?: string | null;
  dateLabel?: string | null;
  timeRange?: string | null;
  doorCode: string;
  wifiName?: string | null;
  wifiPassword?: string | null;
  bookingNotice?: string | null;
  guideUrl: string;
  rulesUrl: string;
  mapsUrl: string;
};

export function BookingConfirmationEmail({
  bookingId,
  customerName,
  roomName,
  branchName,
  dateLabel,
  timeRange,
  doorCode,
  wifiName,
  wifiPassword,
  bookingNotice,
  guideUrl,
  rulesUrl,
  mapsUrl,
}: BookingConfirmationEmailProps) {
  const dateLine = [dateLabel, timeRange].filter(Boolean).join(" - ");
  const resolvedWifiName = wifiName?.trim() || "LAVIE HOME";
  const resolvedWifiPassword = wifiPassword?.trim() || "laviehome";
  const resolvedBookingNotice = bookingNotice?.trim();

  return (
    <Html>
      <Head />
      <Preview>LavieHome xác nhận đặt phòng thành công: {bookingId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <Text style={successMark}>✓</Text>
            <Text style={eyebrow}>LavieHome đã xác nhận thanh toán</Text>
            <Heading style={h1}>Đặt phòng thành công</Heading>
            <Text style={subtitle}>Cảm ơn bạn đã lựa chọn LavieHome.</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Xin chào {customerName || "quý khách"},</Text>
            <Text style={paragraph}>
              LavieHome đã nhận được thanh toán cho đơn đặt phòng của bạn. Vui lòng lưu lại email này để tự
              check-in thuận tiện.
            </Text>

            <Section style={summaryPanel}>
              <Text style={summaryLabel}>Mã nhận phòng</Text>
              <Text style={bookingCode}>{bookingId}</Text>
              <Text style={summaryLine}>{roomName || "Phòng LavieHome"}</Text>
              <Text style={summaryLine}>{branchName || "LavieHome Cần Thơ"}</Text>
              <Text style={summaryLine}>{dateLine || "LavieHome sẽ xác nhận thời gian nhận phòng qua Zalo/email."}</Text>
            </Section>

            <Text style={sectionTitle}>Hướng dẫn tự check-in</Text>

            <Step number="1" title="Địa chỉ">
              <Text style={stepText}>{branchName || "LavieHome Cần Thơ"}</Text>
              <Button href={mapsUrl} style={secondaryButton}>
                Xem trên Google Maps
              </Button>
            </Step>

            <Step number="2" title="Hướng dẫn tự check-in">
              <Text style={stepText}>Quý khách vui lòng xem kỹ hướng dẫn tự check-in và lưu lại.</Text>
              <Button href={guideUrl} style={secondaryButton}>
                Xem hướng dẫn
              </Button>
              <Text style={doorCodeText}>
                Mật khẩu cửa: <span style={doorCodeValue}>{doorCode}</span>
              </Text>
            </Step>

            <Step number="3" title="Nội quy">
              <Text style={stepText}>Quý khách vui lòng đọc kỹ nội quy và tuân thủ khi ở tại LavieHome.</Text>
              <Button href={rulesUrl} style={secondaryButton}>
                Xem nội quy
              </Button>
            </Step>

            <Step number="4" title="Mật khẩu Wi-Fi">
              <Text style={stepText}>Tên Wifi: {resolvedWifiName}</Text>
              <Text style={stepText}>Mật khẩu: {resolvedWifiPassword}</Text>
              {resolvedBookingNotice && <Text style={noticeText}>{resolvedBookingNotice}</Text>}
            </Step>

            <Section style={footerPanel}>
              <Button href={guideUrl} style={primaryButton}>
                Mở trang hướng dẫn
              </Button>
              <Text style={footerText}>Nếu cần hỗ trợ, quý khách vui lòng liên hệ Hotline/Zalo LavieHome.</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <Section style={stepPanel}>
      <Text style={stepNumber}>{number}</Text>
      <Section style={stepBody}>
        <Text style={stepTitle}>{title}</Text>
        {children}
      </Section>
    </Section>
  );
}

const main = {
  backgroundColor: "#100813",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  margin: "0",
  padding: "24px 12px",
};

const container = {
  backgroundColor: "#1b111f",
  border: "2px solid rgba(255, 255, 255, 0.14)",
  borderRadius: "24px",
  boxShadow: "6px 6px 0 rgba(243, 90, 189, 0.22)",
  margin: "0 auto",
  maxWidth: "620px",
  overflow: "hidden",
  width: "100%",
};

const hero = {
  backgroundColor: "#1b111f",
  padding: "34px 24px 22px",
  textAlign: "center" as const,
};

const successMark = {
  backgroundColor: "rgba(255, 143, 217, 0.12)",
  border: "1px solid rgba(255, 143, 217, 0.35)",
  borderRadius: "999px",
  color: "#ff8fd9",
  display: "inline-block",
  fontSize: "26px",
  fontWeight: "800",
  height: "52px",
  lineHeight: "52px",
  margin: "0 auto 16px",
  textAlign: "center" as const,
  width: "52px",
};

const eyebrow = {
  color: "#f6d76f",
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "0",
  margin: "0 0 10px",
  textTransform: "uppercase" as const,
};

const h1 = {
  color: "#ffb6e5",
  fontSize: "34px",
  fontWeight: "900",
  letterSpacing: "0",
  lineHeight: "1.12",
  margin: "0 0 12px",
};

const subtitle = {
  color: "#fff8fb",
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: "1.45",
  margin: "0",
};

const content = {
  padding: "0 24px 30px",
};

const greeting = {
  color: "#fff8fb",
  fontSize: "16px",
  fontWeight: "800",
  margin: "0 0 8px",
};

const paragraph = {
  color: "rgba(255, 248, 251, 0.76)",
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "0 0 20px",
};

const summaryPanel = {
  backgroundColor: "#170c1d",
  border: "1px solid rgba(255, 143, 217, 0.28)",
  borderRadius: "18px",
  margin: "22px 0 28px",
  overflow: "hidden",
  textAlign: "center" as const,
};

const summaryLabel = {
  backgroundColor: "rgba(255, 143, 217, 0.12)",
  color: "#ffd8f1",
  fontSize: "17px",
  fontWeight: "800",
  margin: "0",
  padding: "14px",
};

const bookingCode = {
  borderTop: "1px solid rgba(255, 255, 255, 0.11)",
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "900",
  margin: "0",
  padding: "18px 12px",
  wordBreak: "break-word" as const,
};

const summaryLine = {
  borderTop: "1px solid rgba(255, 255, 255, 0.11)",
  color: "#fff8fb",
  fontSize: "16px",
  fontWeight: "750",
  lineHeight: "1.45",
  margin: "0",
  padding: "14px 12px",
};

const sectionTitle = {
  color: "#ffb6e5",
  fontSize: "23px",
  fontWeight: "900",
  letterSpacing: "0",
  margin: "0 0 18px",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
};

const stepPanel = {
  backgroundColor: "#170c1d",
  border: "1px solid rgba(255, 143, 217, 0.22)",
  borderRadius: "18px",
  margin: "0 0 14px",
  padding: "16px",
};

const stepNumber = {
  background: "linear-gradient(135deg, #f35abd 0%, #f6d76f 100%)",
  border: "2px solid #ffffff",
  borderRadius: "999px",
  color: "#170913",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "900",
  height: "34px",
  lineHeight: "31px",
  margin: "0 12px 0 0",
  textAlign: "center" as const,
  width: "34px",
};

const stepBody = {
  display: "inline-block",
  verticalAlign: "top",
  width: "calc(100% - 52px)",
};

const stepTitle = {
  color: "#ffb6e5",
  fontSize: "17px",
  fontWeight: "900",
  lineHeight: "1.35",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const stepText = {
  color: "rgba(255, 248, 251, 0.78)",
  fontSize: "15px",
  lineHeight: "1.55",
  margin: "0 0 10px",
};

const secondaryButton = {
  backgroundColor: "rgba(246, 215, 111, 0.14)",
  border: "1px solid rgba(246, 215, 111, 0.55)",
  borderRadius: "12px",
  color: "#f6d76f",
  fontSize: "14px",
  fontWeight: "800",
  padding: "10px 14px",
  textDecoration: "none",
};

const doorCodeText = {
  color: "#f6d76f",
  fontSize: "17px",
  fontWeight: "900",
  lineHeight: "1.4",
  margin: "14px 0 0",
};

const doorCodeValue = {
  color: "#ffb6e5",
  fontFamily: "Consolas, 'SFMono-Regular', monospace",
};

const noticeText = {
  backgroundColor: "rgba(246, 215, 111, 0.12)",
  border: "1px solid rgba(246, 215, 111, 0.35)",
  borderRadius: "12px",
  color: "#fff8fb",
  fontSize: "14px",
  fontWeight: "750",
  lineHeight: "1.55",
  margin: "12px 0 0",
  padding: "10px 12px",
};

const footerPanel = {
  margin: "24px 0 0",
  textAlign: "center" as const,
};

const primaryButton = {
  background: "linear-gradient(135deg, #f35abd 0%, #ff8fd9 54%, #f6d76f 100%)",
  border: "2px solid #ffffff",
  borderRadius: "16px",
  color: "#170913",
  fontSize: "14px",
  fontWeight: "900",
  padding: "13px 20px",
  textDecoration: "none",
  textTransform: "uppercase" as const,
};

const footerText = {
  color: "rgba(255, 248, 251, 0.6)",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "16px 0 0",
};
