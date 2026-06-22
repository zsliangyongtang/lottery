import { NextRequest, NextResponse } from "next/server";
import { selectGift, getPrizes } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { code, giftId } = await req.json();
    if (!code || !giftId) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const link = await selectGift(code, giftId);
    if (!link) {
      return NextResponse.json({ error: "无效的链接" }, { status: 404 });
    }

    const prizes = await getPrizes();
    const gifts = prizes[link.prizeTier] || [];
    const selectedGift = gifts.find((g) => g.id === giftId);

    return NextResponse.json({
      ...link,
      selectedGift,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "服务器错误" },
      { status: 500 }
    );
  }
}
