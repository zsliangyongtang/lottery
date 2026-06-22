export interface Gift {
  id: string;
  name: string;
  emoji: string;
}

export const PRIZE_LABELS: Record<string, string> = {
  first: "🎉 一等奖",
  second: "🎊 二等奖",
  third: "🎁 三等奖",
  thanks: "😊 谢谢参与",
};
