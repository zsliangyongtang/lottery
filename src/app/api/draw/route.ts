import { NextRequest, NextResponse } from "next/server";
import { drawLink, getLink, getPrizes } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "缺少链接码" }, { status: 400 });
    }
    const link = await getLink(code);
    if (!link) {
      return NextResponse.json({ error: "无效的链接" }, { status: 404 });
    }
    const prizes = await getPrizes();
    return NextResponse.json({
      ...link,
      gifts: prizes[link.prizeTier] || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `[GET] ${e?.message || e?.toString?.() || "未知错误"}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const prizes = await getPrizes();
    return NextResponse.json({
      ...link,
      gifts: prizes[link.prizeTier] || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `[POST] ${e?.message || e?.toString?.() || "未知错误"}` },
      { status: 500 }
    );
  }
}
