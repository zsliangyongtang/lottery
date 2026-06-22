import { NextRequest, NextResponse } from "next/server";
import { selectGift } from "@/lib/db";
import { getGifts } from "@/lib/gifts";

export async function POST(req: NextRequest) {
  const { code, giftId } = await req.json();
  if (!code || !giftId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const link = await selectGift(code, giftId);
  if (!link) {
    return NextResponse.json({ error: "无效的链接" }, { status: 404 });
  }

  const gifts = getGifts(link.prizeTier);
  const selectedGift = gifts.find((g) => g.id === giftId);

  return NextResponse.json({
    ...link,
    selectedGift,
  });
}
