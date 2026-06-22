import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export interface LotteryLink {
  code: string;
  recipientName: string;
  phone: string; // recipient phone number (set by admin, used for verification)
  prizeTier: "first" | "second" | "third" | "thanks";
  preSelectedGiftId: string | null; // admin pre-selects a specific gift
  isVerified: boolean; // phone number verified by recipient
  isDrawn: boolean;
  selectedGiftId: string | null; // what the recipient chose
  createdAt: string;
  drawnAt: string | null;
}

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const LINK_PREFIX = "lottery:link:";
const LINKS_INDEX = "lottery:links";

export async function createLink(data: {
  recipientName: string;
  phone: string;
  prizeTier: "first" | "second" | "third" | "thanks";
  preSelectedGiftId: string | null;
}): Promise<LotteryLink> {
  const code = generateCode();
  const link: LotteryLink = {
    code,
    recipientName: data.recipientName,
    phone: data.phone,
    prizeTier: data.prizeTier,
    preSelectedGiftId: data.preSelectedGiftId,
    isVerified: false,
    isDrawn: false,
    selectedGiftId: null,
    createdAt: new Date().toISOString(),
    drawnAt: null,
  };

  await redis.set(`${LINK_PREFIX}${code}`, JSON.stringify(link));
  await redis.lpush(LINKS_INDEX, code);
  return link;
}

export async function getLink(code: string): Promise<LotteryLink | null> {
  const raw = await redis.get(`${LINK_PREFIX}${code}`);
  if (!raw) return null;
  if (typeof raw === "string") return JSON.parse(raw) as LotteryLink;
  return raw as LotteryLink;
}

export async function verifyPhone(
  code: string,
  phone: string
): Promise<{ success: boolean; error?: string; link?: LotteryLink }> {
  const link = await getLink(code);
  if (!link) return { success: false, error: "无效的链接" };
  if (link.isVerified) return { success: true, link }; // already verified

  // Normalize: remove spaces and compare
  if (link.phone.replace(/\s/g, "") !== phone.replace(/\s/g, "")) {
    return { success: false, error: "手机号不匹配，请确认后再试" };
  }

  link.isVerified = true;
  await redis.set(`${LINK_PREFIX}${code}`, JSON.stringify(link));
  return { success: true, link };
}

export async function drawLink(code: string): Promise<LotteryLink | null> {
  const link = await getLink(code);
  if (!link) return null;
  if (!link.isVerified) return null; // must verify phone first
  if (!link.isDrawn) {
    link.isDrawn = true;
    link.drawnAt = new Date().toISOString();
    await redis.set(`${LINK_PREFIX}${code}`, JSON.stringify(link));
  }
  return link;
}

export async function selectGift(
  code: string,
  giftId: string
): Promise<LotteryLink | null> {
  const link = await getLink(code);
  if (!link) return null;
  if (link.selectedGiftId) return link; // already selected, don't change
  link.selectedGiftId = giftId;
  await redis.set(`${LINK_PREFIX}${code}`, JSON.stringify(link));
  return link;
}

export async function listLinks(): Promise<LotteryLink[]> {
  const codes = await redis.lrange(LINKS_INDEX, 0, -1);
  if (!codes || codes.length === 0) return [];
  const keys = (codes as string[]).map((c) => `${LINK_PREFIX}${c}`);
  const rawList = await redis.mget(...keys);
  return (rawList as any[])
    .filter(Boolean)
    .map((r) => (typeof r === "string" ? JSON.parse(r) : r) as LotteryLink)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function deleteLink(code: string): Promise<void> {
  await redis.del(`${LINK_PREFIX}${code}`);
  await redis.lrem(LINKS_INDEX, 0, code);
}
