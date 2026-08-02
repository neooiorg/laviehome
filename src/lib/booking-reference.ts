export function makeBookingReference(branchId: number | string | null | undefined) {
  const normalizedBranch = String(branchId ?? "0")
    .replace(/\D/g, "")
    .padStart(2, "0")
    .slice(-2);
  const timestampPart = Date.now().toString().slice(-8);
  const randomPart = Math.floor(Math.random() * 90 + 10).toString();

  return `LVH${normalizedBranch}${timestampPart}${randomPart}`;
}

export function extractBookingReference(input: string) {
  return input.toUpperCase().match(/LVH\d{8,12}/)?.[0] ?? null;
}

export function makePaymentReference(bookingId: string, sequence: number) {
  return `${bookingId.toUpperCase()}P${String(sequence).padStart(2, "0")}`;
}

export function extractPaymentReference(input: string) {
  return input.toUpperCase().match(/LVH\d{8,12}(?:P\d{2,6})?/)?.[0] ?? null;
}
