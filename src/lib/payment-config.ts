// Bank / SePay payment configuration.
//
// Source of truth is the environment (set on the server / Dokploy) so the
// receiving account can be switched without a code change. Values flow
// server-side → props into the client checkout components; nothing bank-related
// is hard-coded in the UI. The fallbacks below are the current production
// MBBank account and exist only so local dev works without a full env file.
export type BankPaymentConfig = {
  /** VietQR bank code used to build the QR image URL (e.g. "MB", "TPB"). */
  bankCode: string;
  /** Human-readable bank name shown to the customer. */
  bankName: string;
  /** Receiving account number. */
  accountNumber: string;
  /** Account holder name (shown to the customer + passed to VietQR). */
  accountName: string;
};

export function getBankPaymentConfig(): BankPaymentConfig {
  return {
    bankCode: process.env.SEPAY_BANK_CODE ?? "MB",
    bankName: process.env.SEPAY_BANK_NAME ?? "MBBank",
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER ?? "3900111681111",
    accountName: process.env.SEPAY_ACCOUNT_NAME ?? "PHAM NHAT THONG",
  };
}
