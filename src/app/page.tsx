"use client";

import { useState, useEffect, useCallback } from "react";
import { PRIZE_LABELS, Gift } from "@/lib/gifts";

interface LotteryLink {
  code: string;
  recipientName: string;
  phone: string;
  prizeTier: string;
  preSelectedGiftId: string | null;
  isVerified: boolean;
  isDrawn: boolean;
  selectedGiftId: string | null;
  createdAt: string;
  url?: string;
}

const DEFAULT_EMOJIS: Record<string, string[]> = {
  first: ["📱", "💻", "📟", "⌚"],
  second: ["🎧", "⌨️", "🔊", "🔋"],
  third: ["☕", "🎬", "📚", "🍿"],
};

function emptyGifts(tier: string): Gift[] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: `${tier[0]}${i + 1}`,
    name: "",
    emoji: DEFAULT_EMOJIS[tier]?.[i] || "🎁",
  }));
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [links, setLinks] = useState<LotteryLink[]>([]);
  const [loading, setLoading] = useState(false);

  // Prize management state
  const [prizes, setPrizes] = useState<Record<string, Gift[]>>({});
  const [activePrizeTab, setActivePrizeTab] = useState("first");
  const [editingPrizes, setEditingPrizes] = useState<Record<string, Gift[]>>({
    first: emptyGifts("first"),
    second: emptyGifts("second"),
    third: emptyGifts("third"),
  });
  const [savingPrizes, setSavingPrizes] = useState(false);

  // Create form state
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [prizeTier, setPrizeTier] = useState("first");
  const [preSelectedGiftId, setPreSelectedGiftId] = useState("");

  // Toast
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Load prizes from server
  const loadPrizes = useCallback(async () => {
    try {
      const res = await fetch("/api/prizes");
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setPrizes(data);
          setEditingPrizes({
            first: data.first || emptyGifts("first"),
            second: data.second || emptyGifts("second"),
            third: data.third || emptyGifts("third"),
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchLinks = useCallback(async () => {
    if (!password) return;
    try {
      const res = await fetch(
        `/api/links?password=${encodeURIComponent(password)}`
      );
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch {
      // ignore
    }
  }, [password]);

  useEffect(() => {
    if (authed) {
      loadPrizes();
      fetchLinks();
    }
  }, [authed, loadPrizes, fetchLinks]);

  const handleLogin = () => {
    if (password.length >= 3) {
      setAuthed(true);
    }
  };

  // Update a gift field in editing state
  const updateGift = (
    tier: string,
    index: number,
    field: "name" | "emoji",
    value: string
  ) => {
    setEditingPrizes((prev) => {
      const gifts = [...prev[tier]];
      gifts[index] = { ...gifts[index], [field]: value };
      return { ...prev, [tier]: gifts };
    });
  };

  // Save prizes
  const handleSavePrizes = async () => {
    setSavingPrizes(true);
    try {
      const res = await fetch("/api/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, prizes: editingPrizes }),
      });
      if (res.ok) {
        setPrizes(editingPrizes);
        showToast("奖项已保存！");
      } else {
        const err = await res.json();
        showToast(err.error || "保存失败");
      }
    } catch {
      showToast("网络错误");
    } finally {
      setSavingPrizes(false);
    }
  };

  const handleCreate = async () => {
    if (!recipientName.trim()) {
      showToast("请输入对方姓名");
      return;
    }
    if (!phone.trim() || !/^1\d{10}$/.test(phone.trim())) {
      showToast("请输入正确的11位手机号");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          prizeTier,
          preSelectedGiftId: preSelectedGiftId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLinks([data, ...links]);
        setRecipientName("");
        setPhone("");
        setPreSelectedGiftId("");
        showToast("链接创建成功！");
      } else {
        const err = await res.json();
        showToast(err.error || "创建失败");
      }
    } catch {
      showToast("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm("确定要删除这个链接吗？")) return;
    try {
      await fetch("/api/links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      setLinks(links.filter((l) => l.code !== code));
      showToast("已删除");
    } catch {
      showToast("删除失败");
    }
  };

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/draw/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("链接已复制！");
    });
  };

  const getGiftName = (tier: string, giftId: string | null) => {
    if (!giftId) return "-";
    const gifts = prizes[tier];
    if (!gifts) return giftId;
    return gifts.find((g) => g.id === giftId)?.name || giftId;
  };

  // Current active tier gifts for the form select
  const activeTierGifts = prizes[prizeTier] || [];

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="lottery-card p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-amber-400">
            🔐 抽奖管理后台
          </h1>
          <input
            type="password"
            className="admin-input mb-4"
            placeholder="请输入管理密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button className="admin-btn w-full" onClick={handleLogin}>
            进入后台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-400">
          🎰 抽奖管理后台
        </h1>

        {/* Prize Management */}
        <div className="lottery-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-300">
            🏆 奖项礼品设置
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {["first", "second", "third"].map((tier) => (
              <button
                key={tier}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePrizeTab === tier
                    ? "bg-amber-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                onClick={() => setActivePrizeTab(tier)}
              >
                {PRIZE_LABELS[tier]}
              </button>
            ))}
          </div>

          {/* Gift inputs */}
          <div className="space-y-3 mb-6">
            {editingPrizes[activePrizeTab]?.map((gift, i) => (
              <div key={gift.id} className="flex items-center gap-3">
                <span className="text-slate-500 text-sm w-6">{i + 1}.</span>
                <input
                  className="admin-input w-16 text-center text-xl"
                  placeholder="🎁"
                  maxLength={4}
                  value={gift.emoji}
                  onChange={(e) =>
                    updateGift(activePrizeTab, i, "emoji", e.target.value)
                  }
                />
                <input
                  className="admin-input flex-1"
                  placeholder={`礼品 ${i + 1} 名称`}
                  value={gift.name}
                  onChange={(e) =>
                    updateGift(activePrizeTab, i, "name", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <button
            className="admin-btn w-full"
            onClick={handleSavePrizes}
            disabled={savingPrizes}
          >
            {savingPrizes ? "保存中..." : "💾 保存奖项"}
          </button>
        </div>

        {/* Create form */}
        <div className="lottery-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-300">
            创建抽奖链接
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                对方姓名 / 备注
              </label>
              <input
                className="admin-input"
                placeholder="例如：张三"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                对方手机号
              </label>
              <input
                className="admin-input"
                type="tel"
                placeholder="11位手机号"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">奖项</label>
              <select
                className="admin-select"
                value={prizeTier}
                onChange={(e) => {
                  setPrizeTier(e.target.value);
                  setPreSelectedGiftId("");
                }}
              >
                <option value="first">{PRIZE_LABELS.first}</option>
                <option value="second">{PRIZE_LABELS.second}</option>
                <option value="third">{PRIZE_LABELS.third}</option>
                <option value="thanks">{PRIZE_LABELS.thanks}</option>
              </select>
            </div>
          </div>

          {prizeTier !== "thanks" && activeTierGifts.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">
                预设礼品（可选，不选则由对方自行选择）
              </label>
              <select
                className="admin-select"
                value={preSelectedGiftId}
                onChange={(e) => setPreSelectedGiftId(e.target.value)}
              >
                <option value="">不预设</option>
                {activeTierGifts.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="admin-btn w-full"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "创建中..." : "✨ 创建链接"}
          </button>
        </div>

        {/* Links list */}
        <div className="lottery-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-amber-300">
              已创建的链接 ({links.length})
            </h2>
            <button
              className="text-sm text-slate-400 hover:text-white"
              onClick={fetchLinks}
            >
              🔄 刷新
            </button>
          </div>

          {links.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              还没有创建任何链接
            </p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.code}
                  className="bg-slate-800/50 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {link.recipientName}
                      </span>
                      <span className="text-sm px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        {PRIZE_LABELS[link.prizeTier]}
                      </span>
                      {link.isVerified && (
                        <span className="text-sm px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                          已验证
                        </span>
                      )}
                      {link.isDrawn && (
                        <span className="text-sm px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          已抽奖
                        </span>
                      )}
                      {link.selectedGiftId && (
                        <span className="text-sm px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          已选礼
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 space-x-2">
                      <span>码: {link.code}</span>
                      <span>📱 {link.phone}</span>
                      {link.preSelectedGiftId && (
                        <span>
                          预设:{" "}
                          {getGiftName(link.prizeTier, link.preSelectedGiftId)}
                        </span>
                      )}
                      {link.selectedGiftId && (
                        <span>
                          已选:{" "}
                          {getGiftName(link.prizeTier, link.selectedGiftId)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 text-sm rounded bg-amber-600 hover:bg-amber-500 text-white"
                      onClick={() => handleCopy(link.code)}
                    >
                      复制链接
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm rounded bg-red-600/50 hover:bg-red-600 text-white"
                      onClick={() => handleDelete(link.code)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
