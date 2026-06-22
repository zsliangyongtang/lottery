import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET() {
  const result: Record<string, any> = {};

  // 1. 检查环境变量
  result.REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
    ? process.env.UPSTASH_REDIS_REST_URL.substring(0, 30) + "..."
    : "未设置";
  result.REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
    ? "已设置 (" + process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 8) + "...)"
    : "未设置";
  result.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? "已设置" : "未设置";

  // 2. 尝试连接 Redis
  try {
    const redis = Redis.fromEnv();
    const ping = await redis.ping();
    result.redisStatus = ping === "PONG" ? "连接成功" : `异常: ${ping}`;
  } catch (e: any) {
    result.redisStatus = `连接失败: ${e.message}`;
  }

  return NextResponse.json(result);
}
