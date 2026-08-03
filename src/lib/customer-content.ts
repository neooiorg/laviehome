export type CustomerContentConfig = {
  guide: string;
  rules: string;
  cancellationPolicy: string;
};

export const DEFAULT_CUSTOMER_CONTENT: CustomerContentConfig = {
  guide: `### Hướng dẫn sử dụng
- Tìm phòng phù hợp, chọn ngày và khung giờ mong muốn.
- Bấm đặt phòng, nhập đầy đủ thông tin người đặt và email nhận hướng dẫn.
- Tạo mã thanh toán, chuyển khoản đúng nội dung hiển thị trên màn hình.
- Sau khi thanh toán thành công, hệ thống gửi mã nhận phòng, mật khẩu cửa và hướng dẫn check-in qua email.
- Nếu cần hỗ trợ, vui lòng liên hệ Hotline/Zalo LavieHome.`,
  rules: `### 1. Các lưu ý khi check-in/check-out
- Vui lòng check-in đúng khung giờ đã đặt để quy trình vệ sinh phòng và rà soát cam ẩn được hoàn tất.
- Muốn nhận phòng sớm hoặc trả phòng trễ, vui lòng liên hệ Hotline 0706595899 trước ít nhất 2 giờ để kiểm tra tình trạng phòng và hỗ trợ. Phụ phí tham khảo: 60k/giờ.
- Quý khách tự lấy chìa khóa hoặc mật khẩu khóa số theo hướng dẫn sau khi đã thanh toán đặt phòng.
- Khi trả phòng, vui lòng khóa cửa cẩn thận và đặt chìa khóa đúng vị trí ban đầu.
- Quý khách tự bảo quản tư trang cá nhân; LavieHome không chịu trách nhiệm với vật dụng bỏ quên hoặc thất lạc.

### 2. Điều khoản cấm
- Nghiêm cấm sử dụng, tàng trữ, mua bán ma túy, chất kích thích hoặc chất cấm theo quy định pháp luật.
- Nghiêm cấm tàng trữ vũ khí, vật liệu cháy nổ, hóa chất độc hại hoặc vật dụng nguy hiểm.
- Nghiêm cấm mua bán dâm, môi giới mại dâm hoặc tổ chức đánh bạc dưới mọi hình thức.
- Mọi vi phạm nghiêm trọng sẽ bị buộc rời khỏi Home ngay lập tức và không bồi hoàn.

### 3. Vệ sinh và trật tự chung
- Sau 22:00, vui lòng tiết chế âm lượng để không ảnh hưởng khách lưu trú khác.
- Không mang thú cưng vào homestay trừ khi có thỏa thuận trước với Home.
- Không tự ý di chuyển, tháo lắp hoặc mang đồ nội thất ra khỏi vị trí ban đầu.
- Không chế biến đồ ăn nặng mùi trong phòng. Vui lòng thu gom rác, dọn bếp và rửa chén đĩa sau khi sử dụng.`,
  cancellationPolicy: `### Chính sách hủy phòng
Mức phí hủy phòng được tính dựa trên thời gian thông báo trước so với giờ nhận phòng đã xác nhận:
- Hủy phòng trước 24 tiếng so với giờ nhận phòng: chịu phí 30% giá trị đặt phòng.
- Hủy phòng trong khoảng 6-23 tiếng trước giờ nhận phòng: chịu phí 40% giá trị đặt phòng.
- Hủy phòng trong khoảng 3-6 tiếng trước giờ nhận phòng: không hoàn tiền, chỉ được bảo lưu đặt phòng tùy chính sách từng thời điểm.
- Cận giờ nhận phòng, tức còn dưới 3 tiếng, nếu khách có việc đột xuất thì nhân viên sẽ hỗ trợ đổi giờ hoặc bảo lưu một phần tùy thời điểm.

LavieHome cam kết áp dụng chính sách hủy phòng công bằng và minh bạch. Toàn bộ thông tin về phí hủy sẽ được thông báo rõ ràng trước khi xác nhận hủy phòng.`,
};

export function normalizeCustomerContentConfig(input: unknown): CustomerContentConfig {
  const source = typeof input === "object" && input !== null ? (input as Partial<CustomerContentConfig>) : {};
  return {
    guide: typeof source.guide === "string" && source.guide.trim() ? source.guide : DEFAULT_CUSTOMER_CONTENT.guide,
    rules: typeof source.rules === "string" && source.rules.trim() ? source.rules : DEFAULT_CUSTOMER_CONTENT.rules,
    cancellationPolicy:
      typeof source.cancellationPolicy === "string" && source.cancellationPolicy.trim()
        ? source.cancellationPolicy
        : DEFAULT_CUSTOMER_CONTENT.cancellationPolicy,
  };
}
