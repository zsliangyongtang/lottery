import { NextRequest, NextResponse } from "next/server";
import { getPrizes, savePrizes } from "@/lib/db";

export async function GET() {
  try {
    const prizes = await getPrizes();
    return NextResponse.json(prizes);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { password, prizes } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }
    if (!prizes || typeof prizes !== "object") {
      return NextResponse.json({ error: "无效的奖项数据" }, { status: 400 });
    }
    await savePrizes(prizes);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "保存失败" },
      { status: 500 }
    );
  }
}
