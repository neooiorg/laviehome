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

type BookingConfirmationEmailProps = {
  bookingId: string;
  customerName?: string | null;
  roomName?: string | null;
  branchName?: string | null;
  dateLabel?: string | null;
  timeRange?: string | null;
  doorCode: string;
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
  guideUrl,
  rulesUrl,
  mapsUrl,
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Lavie Home xác nhận đặt phòng thành công: {bookingId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <Text style={eyebrow}>LavieHome đã xác nhận thanh toán</Text>
            <Heading style={h1}>Đặt phòng thành công</Heading>
            <Text style={subtitle}>Cảm ơn bạn đã lựa chọn LavieHome.</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Xin chào {customerName || "quý khách"},</Text>
            <Text style={paragraph}>
              LavieHome đã nhận được thanh toán cho mã đặt phòng <strong>{bookingId}</strong>. Vui lòng lưu lại
              thông tin bên dưới để tự check-in.
            </Text>

            <Section style={infoBox}>
              <Text style={label}>Mã nhận phòng</Text>
              <Text style={bookingCode}>{bookingId}</Text>
              <Text style={infoLine}>{roomName || "Phòng LavieHome"}</Text>
              <Text style={infoLine}>{branchName || "LavieHome Cần Thơ"}</Text>
              <Text style={infoLine}>
                {dateLabel || ""} {timeRange ? `- ${timeRange}` : ""}
              </Text>
            </Section>

            <Section style={timelineItem}>
              <Text style={stepTitle}>1. Địa chỉ</Text>
              <Text style={paragraph}>{branchName || "LavieHome Cần Thơ"}</Text>
              <Button href={mapsUrl} style={linkButton}>
                Xem trên Google Maps
              </Button>
            </Section>

            <Section style={timelineItem}>
              <Text style={stepTitle}>2. Hướng dẫn tự check-in</Text>
              <Text style={paragraph}>Quý khách vui lòng xem kỹ hướng dẫn tự check-in và lưu lại.</Text>
              <Button href={guideUrl} style={linkButton}>
                Xem hướng dẫn
              </Button>
              <Text style={doorCodeText}>Mật khẩu cửa: {doorCode}</Text>
            </Section>

            <Section style={timelineItem}>
              <Text style={stepTitle}>3. Nội quy</Text>
              <Text style={paragraph}>Quý khách vui lòng đọc kỹ nội quy và tuân thủ khi ở tại LavieHome.</Text>
              <Button href={rulesUrl} style={linkButton}>
                Xem nội quy
              </Button>
            </Section>

            <Section style={timelineItem}>
              <Text style={stepTitle}>4. Mật khẩu Wi-Fi</Text>
              <Text style={paragraph}>Tên Wifi: LAVIE HOME</Text>
              <Text style={paragraph}>Mật khẩu: laviehome</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#100813",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  padding: "32px 0",
};

const container = {
  backgroundColor: "#1b111f",
  border: "1px solid rgba(255, 143, 217, 0.22)",
  borderRadius: "18px",
  margin: "0 auto",
  maxWidth: "560px",
  overflow: "hidden",
};

const hero = {
  padding: "36px 32px 24px",
  textAlign: "center" as const,
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
  color: "#ff8fd9",
  fontSize: "34px",
  fontWeight: "800",
  letterSpacing: "0",
  margin: "0 0 12px",
};

const subtitle = {
  color: "#fff8fb",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
};

const content = {
  padding: "0 32px 34px",
};

const greeting = {
  color: "#fff8fb",
  fontSize: "16px",
  fontWeight: "700",
};

const paragraph = {
  color: "#f7d6eb",
  fontSize: "15px",
  lineHeight: "1.65",
};

const infoBox = {
  border: "1px solid rgba(255, 143, 217, 0.28)",
  borderRadius: "12px",
  margin: "24px 0",
  overflow: "hidden",
  textAlign: "center" as const,
};

const label = {
  backgroundColor: "rgba(255, 143, 217, 0.12)",
  color: "#fff8fb",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
  padding: "14px",
};

const bookingCode = {
  color: "#fff8fb",
  fontSize: "24px",
  fontWeight: "800",
  margin: "0",
  padding: "18px 12px",
};

const infoLine = {
  borderTop: "1px solid rgba(255, 255, 255, 0.12)",
  color: "#fff8fb",
  fontSize: "17px",
  fontWeight: "700",
  margin: "0",
  padding: "14px 12px",
};

const timelineItem = {
  backgroundColor: "#170c1d",
  border: "1px solid rgba(255, 143, 217, 0.2)",
  borderRadius: "14px",
  margin: "0 0 18px",
  padding: "16px 18px",
};

const stepTitle = {
  color: "#ff8fd9",
  fontSize: "18px",
  fontWeight: "800",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const linkButton = {
  backgroundColor: "#f35abd",
  border: "1px solid #ffffff",
  borderRadius: "10px",
  color: "#170913",
  fontSize: "14px",
  fontWeight: "800",
  padding: "10px 16px",
  textDecoration: "none",
};

const doorCodeText = {
  color: "#f6d76f",
  fontSize: "18px",
  fontWeight: "800",
  margin: "14px 0 0",
};
