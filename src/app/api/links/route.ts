import { NextRequest, NextResponse } from "next/server";
import { createLink, listLinks, deleteLink } from "@/lib/db";

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("password") || "";
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const links = await listLinks();
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const { password, recipientName, phone, prizeTier, preSelectedGiftId } =
    await req.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  if (!recipientName || !phone || !prizeTier) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  if (!["first", "second", "third", "thanks"].includes(prizeTier)) {
    return NextResponse.json({ error: "无效的奖项" }, { status: 400 });
  }

  const link = await createLink({
    recipientName,
    phone,
    prizeTier,
    preSelectedGiftId: preSelectedGiftId || null,
  });

  const baseUrl = req.nextUrl.origin;
  return NextResponse.json({
    ...link,
    url: `${baseUrl}/draw/${link.code}`,
  });
}

export async function DELETE(req: NextRequest) {
  const { password, code } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  await deleteLink(code);
  return NextResponse.json({ success: true });
}
