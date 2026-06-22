"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import SlotMachine from "@/components/SlotMachine";
import Confetti from "@/components/Confetti";
import { PRIZE_LABELS, Gift } from "@/lib/gifts";

interface LotteryLink {
  code: string;
  recipientName: string;
  phone: string;
  prizeTier: "first" | "second" | "third" | "thanks";
  preSelectedGiftId: string | null;
  isVerified: boolean;
  isDrawn: boolean;
  selectedGiftId: string | null;
  createdAt: string;
  gifts?: Gift[];
}

type PageState = "loading" | "notFound" | "verify" | "ready" | "drawing" | "result";

export default function DrawPage() {
  const params = useParams();
  const code = params.code as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [link, setLink] = useState<LotteryLink | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [selectingGift, setSelectingGift] = useState(false);
  const [resultEmoji, setResultEmoji] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [debugError, setDebugError] = useState("");

  const getResultEmoji = (data: LotteryLink, _giftsList: Gift[]) => {
    if (data.prizeTier === "thanks") return "😊";
    return "中奖了";
  };

  // Load link data on mount (without drawing)
  const loadLink = useCallback(async () => {
    try {
      const res = await fetch(`/api/draw?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        try {
          const err = await res.json();
          setDebugError(`${res.status}: ${err.error || "未知错误"}`);
        } catch {
          setDebugError(`${res.status}: ${res.statusText}`);
        }
        setPageState("notFound");
        return;
      }
      const data = await res.json();
      setLink(data);
      setGifts(data.gifts || []);

      if (data.isDrawn) {
        setPageState("result");
        setSelectedGiftId(data.selectedGiftId);
        setResultEmoji(getResultEmoji(data, data.gifts || []));
        if (data.prizeTier !== "thanks" && data.selectedGiftId) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
      } else if (!data.isVerified) {
        setPageState("verify");
      } else {
        setPageState("ready");
      }
    } catch (e: any) {
      setDebugError(`网络错误: ${e?.message || "无法连接到服务器"}`);
      setPageState("notFound");
    }
  }, [code]);

  useEffect(() => {
    loadLink();
  }, [loadLink]);

  // Handle phone verification
  const handleVerify = async () => {
    const phone = verifyPhone.trim();
    if (!phone || !/^1\d{10}$/.test(phone)) {
      setVerifyError("请输入正确的11位手机号");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, phone }),
      });
      if (res.ok) {
        const data = await res.json();
        setLink(data);
        const giftsList = data.gifts || [];
        setGifts(giftsList);
        if (data.isDrawn) {
          setPageState("result");
          setSelectedGiftId(data.selectedGiftId);
          setResultEmoji(getResultEmoji(data, giftsList));
          if (data.prizeTier !== "thanks" && data.selectedGiftId) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
          }
        } else {
          setPageState("ready");
        }
      } else {
        const err = await res.json();
        setVerifyError(err.error || "验证失败");
      }
    } catch {
      setVerifyError("网络错误，请重试");
    } finally {
      setVerifying(false);
    }
  };

  // Handle draw button click
  const handleDraw = async () => {
    setPageState("drawing");
    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        setPageState("notFound");
        return;
      }
      const data = await res.json();
      setLink(data);
      const giftsList = data.gifts || [];
      setGifts(giftsList);

      setTimeout(() => {
        setPageState("result");
        setResultEmoji(getResultEmoji(data, giftsList));
        if (data.preSelectedGiftId) {
          setSelectedGiftId(data.preSelectedGiftId);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
      }, 2500);
    } catch {
      setPageState("ready");
    }
  };

  const handleSelectGift = async (gift: Gift) => {
    if (selectingGift || selectedGiftId) return;
    setSelectingGift(true);
    try {
      const res = await fetch("/api/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, giftId: gift.id }),
      });
      if (res.ok) {
        setSelectedGiftId(gift.id);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } catch {
      // ignore
    } finally {
      setSelectingGift(false);
    }
  };

  const isWinner = link?.prizeTier !== "thanks";
  const selectedGift = gifts.find((g) => g.id === selectedGiftId);

  // --- Loading state ---
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce-slow">🎰</div>
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  // --- Not found state ---
  if (pageState === "notFound") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="lottery-card p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold mb-2">链接无效</h2>
          <p className="text-slate-400 mb-4">
            此抽奖链接不存在或已失效，请联系发送者获取新的链接。
          </p>
          {debugError && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-left">
              <p className="text-red-400 text-xs font-mono break-all">
                {debugError}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Phone verification state ---
  if (pageState === "verify" && link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="lottery-card p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🔐</div>
          <div className="text-lg text-slate-400 mb-2">
            {link.recipientName}，你好
          </div>
          <h2 className="text-xl font-bold mb-2 text-amber-400">
            身份验证
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            请输入你的手机号以确认身份
          </p>
          <div className="mb-4">
            <input
              className="admin-input text-center text-lg tracking-widest"
              type="tel"
              placeholder="请输入11位手机号"
              maxLength={11}
              value={verifyPhone}
              onChange={(e) => {
                setVerifyPhone(e.target.value.replace(/\D/g, ""));
                setVerifyError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            {verifyError && (
              <p className="text-red-400 text-sm mt-2">{verifyError}</p>
            )}
          </div>
          <button
            className="draw-btn w-full"
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? "验证中..." : "确认身份"}
          </button>
        </div>
      </div>
    );
  }

  // --- Ready to draw state ---
  if (pageState === "ready" && link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="lottery-card p-8 text-center max-w-md w-full">
          <div className="text-lg text-slate-400 mb-2">
            {link.recipientName}，你好
          </div>
          <h2 className="text-2xl font-bold mb-6 text-amber-400">
            你的专属抽奖
          </h2>
          <div className="mb-8">
            <div className="text-6xl mb-4 animate-float">🎁</div>
            <p className="text-slate-400 text-sm">
              点击下方按钮开始抽奖，每人仅限一次
            </p>
          </div>
          <button className="draw-btn" onClick={handleDraw}>
            开始抽奖
          </button>
        </div>
      </div>
    );
  }

  // --- Drawing animation state ---
  if (pageState === "drawing") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="lottery-card p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-semibold mb-6 text-amber-400">
            抽奖中...
          </h2>
          <SlotMachine spinning={true} resultEmoji="" />
          <p className="text-slate-400 mt-6 text-sm animate-pulse">
            正在为你揭晓结果
          </p>
        </div>
      </div>
    );
  }

  // --- Result state ---
  if (pageState === "result" && link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Confetti active={showConfetti} />
        <div className="lottery-card p-8 text-center max-w-md w-full">
          <div className="text-lg text-slate-400 mb-1">
            {link.recipientName}
          </div>
          <div
            className={`text-2xl font-bold mb-6 ${
              isWinner ? "text-amber-400" : "text-slate-400"
            }`}
          >
            {PRIZE_LABELS[link.prizeTier]}
          </div>

          <div className="mb-6">
            <SlotMachine spinning={false} resultEmoji={resultEmoji} />
          </div>

          {!isWinner && (
            <div className="mt-4">
              <p className="text-slate-400">很遗憾，本次未中奖</p>
              <p className="text-slate-500 text-sm mt-2">感谢你的参与！</p>
            </div>
          )}

          {isWinner && (
            <div className="mt-6">
              {link.preSelectedGiftId && selectedGiftId ? (
                <div className="result-reveal">
                  <p className="text-sm text-slate-400 mb-2">
                    {link.preSelectedGiftId ? "你的奖品" : "你选择的奖品"}
                  </p>
                  <div className="gift-card selected inline-block">
                    <div className="text-3xl mb-1">
                      {selectedGift?.emoji || "🎁"}
                    </div>
                    <div className="text-lg font-semibold text-green-400">
                      {selectedGift?.name || "奖品"}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-4">
                    请联系发送者领取奖品
                  </p>
                </div>
              ) : selectedGiftId ? (
                <div>
                  <p className="text-sm text-slate-400 mb-2">你选择的奖品</p>
                  <div className="gift-card selected inline-block">
                    <div className="text-3xl mb-1">
                      {selectedGift?.emoji || "🎁"}
                    </div>
                    <div className="text-lg font-semibold text-green-400">
                      {selectedGift?.name || "奖品"}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-4">
                    请联系发送者领取奖品
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 mb-3">
                    请选择你心仪的奖品
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {gifts.map((gift) => (
                      <button
                        key={gift.id}
                        className="gift-card flex flex-col items-center"
                        onClick={() => handleSelectGift(gift)}
                        disabled={selectingGift}
                      >
                        <span className="text-3xl mb-1">{gift.emoji}</span>
                        <span className="text-sm font-medium">
                          {gift.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectingGift && (
                    <p className="text-slate-500 text-xs mt-3 animate-pulse">
                      确认中...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
