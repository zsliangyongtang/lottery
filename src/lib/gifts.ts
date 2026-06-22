export interface Gift {
  id: string;
  name: string;
  emoji: string;
}

export const GIFTS: Record<string, Gift[]> = {
  first: [
    { id: "f1", name: "iPhone 16 Pro", emoji: "📱" },
    { id: "f2", name: "MacBook Air", emoji: "💻" },
    { id: "f3", name: "iPad Pro", emoji: "📟" },
    { id: "f4", name: "Apple Watch Ultra", emoji: "⌚" },
  ],
  second: [
    { id: "s1", name: "AirPods Pro", emoji: "🎧" },
    { id: "s2", name: "机械键盘", emoji: "⌨️" },
    { id: "s3", name: "蓝牙音箱", emoji: "🔊" },
    { id: "s4", name: "无线充电宝", emoji: "🔋" },
  ],
  third: [
    { id: "t1", name: "星巴克礼品卡", emoji: "☕" },
    { id: "t2", name: "电影票两张", emoji: "🎬" },
    { id: "t3", name: "图书券", emoji: "📚" },
    { id: "t4", name: "零食大礼包", emoji: "🍿" },
  ],
};

export const PRIZE_LABELS: Record<string, string> = {
  first: "🎉 一等奖",
  second: "🎊 二等奖",
  third: "🎁 三等奖",
  thanks: "😊 谢谢参与",
};

export function getGifts(tier: string): Gift[] {
  return GIFTS[tier] || [];
}
