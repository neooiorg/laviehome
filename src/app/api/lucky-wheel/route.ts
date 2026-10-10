import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { z } from "zod";

import {
  createLuckyWheelDeviceId,
  createLuckyWheelSpin,
  getLuckyWheelStatus,
  LUCKY_WHEEL_DEVICE_COOKIE,
} from "@/lib/lucky-wheel";
import { getLuckyWheelConfig } from "@/lib/lucky-wheel-settings";

export const dynamic = "force-dynamic";

const spinSchema = z.object({
  phone: z.string().trim().min(1).max(30),
});

let pool: Pool | null = null;

function getPool() {
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
  });
  return pool;
}

function getDeviceId(request: NextRequest) {
  return request.cookies.get(LUCKY_WHEEL_DEVICE_COOKIE)?.value || createLuckyWheelDeviceId();
}

function withDeviceCookie(response: NextResponse, deviceId: string) {
  response.cookies.set(LUCKY_WHEEL_DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    priority: "high",
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest) {
  const deviceId = getDeviceId(request);
  const client = await getPool().connect();

  try {
    const config = await getLuckyWheelConfig();
    if (!config.enabled) {
      return withDeviceCookie(NextResponse.json({ enabled: false, eligible: false, result: null }), deviceId);
    }
    const result = await getLuckyWheelStatus(client, deviceId, config.prizes);
    return withDeviceCookie(
      NextResponse.json({ enabled: true, eligible: !result, result, prizes: config.prizes }),
      deviceId
    );
  } catch (error) {
    console.error("Lucky wheel status error:", error);
    return withDeviceCookie(
      NextResponse.json({ eligible: false, error: "Không thể kiểm tra lượt quay lúc này." }, { status: 500 }),
      deviceId
    );
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const deviceId = getDeviceId(request);
  const parsed = spinSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return withDeviceCookie(
      NextResponse.json({ error: "Vui lòng nhập số điện thoại hợp lệ." }, { status: 400 }),
      deviceId
    );
  }

  const client = await getPool().connect();

  try {
    const config = await getLuckyWheelConfig();
    const result = await createLuckyWheelSpin(client, {
      deviceId,
      phone: parsed.data.phone,
    });
    return withDeviceCookie(NextResponse.json({ result, prizes: config.prizes }), deviceId);
  } catch (error) {
    if (error instanceof Error && error.message === "LUCKY_WHEEL_DISABLED") {
      return withDeviceCookie(
        NextResponse.json({ error: "Vòng quay hiện đang tạm dừng." }, { status: 403 }),
        deviceId
      );
    }
    if (error instanceof Error && error.message === "INVALID_PHONE") {
      return withDeviceCookie(
        NextResponse.json({ error: "Số điện thoại Việt Nam chưa đúng định dạng." }, { status: 400 }),
        deviceId
      );
    }

    console.error("Lucky wheel spin error:", error);
    return withDeviceCookie(
      NextResponse.json({ error: "Vòng quay đang bận. Vui lòng thử lại sau." }, { status: 500 }),
      deviceId
    );
  } finally {
    client.release();
  }
}
