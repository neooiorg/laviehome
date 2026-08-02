import "server-only";

export const DEFAULT_EMAIL_FROM = "Lavie Home <noreply@neooi.com>";

export function getEmailFrom() {
  return process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
}

export function getResendErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown Resend error");
  }

  if (typeof error === "string") return error;
  return "Unknown Resend error";
}
