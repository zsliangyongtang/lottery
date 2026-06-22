import { NextRequest, NextResponse } from "next/server";
import { verifyPhone } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { code, phone } = await req.json();
  if (!code || !phone) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const result = await verifyPhone(code, phone);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.link);
}
