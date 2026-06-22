import { NextRequest, NextResponse } from "next/server";
import { drawLink, getLink } from "@/lib/db";

// GET: check link state without drawing
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "缺少链接码" }, { status: 400 });
  }

  const link = await getLink(code);
  if (!link) {
    return NextResponse.json({ error: "无效的链接" }, { status: 404 });
  }

  return NextResponse.json(link);
}

// POST: perform the draw
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "缺少链接码" }, { status: 400 });
  }

  const link = await drawLink(code);
  if (!link) {
    return NextResponse.json({ error: "无效的链接" }, { status: 404 });
  }
  if (!link.isVerified) {
    return NextResponse.json({ error: "请先验证手机号" }, { status: 403 });
  }

  return NextResponse.json(link);
}
