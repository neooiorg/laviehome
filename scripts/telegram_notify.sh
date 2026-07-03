#!/bin/bash
# Gửi thông báo Telegram cho CI/CD events
# Usage: ./scripts/telegram_notify.sh <status> <message>

BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
CHAT_ID="${TELEGRAM_CHAT_ID}"

STATUS="${1:-info}"   # success | failure | warning | info
MESSAGE="${2:-No message provided}"

case "$STATUS" in
  success) EMOJI="✅"; LABEL="THÀNH CÔNG" ;;
  failure) EMOJI="❌"; LABEL="THẤT BẠI" ;;
  warning) EMOJI="⚠️"; LABEL="CẢNH BÁO" ;;
  *)       EMOJI="ℹ️"; LABEL="THÔNG BÁO" ;;
esac

TEXT="${EMOJI} *${LABEL}*
${MESSAGE}

🏷 *Dự án:* \`${GITHUB_REPOSITORY}\`
🌿 *Nhánh:* \`${GITHUB_REF_NAME}\`
👤 *Thực hiện bởi:* \`${GITHUB_ACTOR}\`
🕐 *Thời gian:* $(TZ='Asia/Ho_Chi_Minh' date '+%d/%m/%Y %H:%M:%S')
🔗 [Xem chi tiết workflow](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID})"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d chat_id="${CHAT_ID}" \
  -d parse_mode="Markdown" \
  -d disable_web_page_preview="true" \
  -d text="${TEXT}" \
  | grep -q '"ok":true' && echo "Telegram notification sent." || echo "Failed to send Telegram notification."
