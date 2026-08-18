"use server";

import { getRevenueDashboardSummary } from "@/lib/homestay-dashboard";

export async function getCustomRevenueSummary(dateFrom: string, dateTo: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo) || dateFrom > dateTo) {
    throw new Error("Khoảng ngày không hợp lệ.");
  }
  return getRevenueDashboardSummary({ dateFrom, dateTo });
}
