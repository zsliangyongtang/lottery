"use client";

import { useState, useEffect } from "react";

const EMOJIS = ["🎉", "🎁", "🎊", "🎯", "✨", "🌟", "💫", "🎪", "🎭", "🎨"];

interface SlotMachineProps {
  spinning: boolean;
  resultEmoji: string;
}

export default function SlotMachine({ spinning, resultEmoji }: SlotMachineProps) {
  const [slots, setSlots] = useState(["❓", "❓", "❓"]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!spinning) return;
    setRevealed(false);
    const interval = setInterval(() => {
      setSlots([
        EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      ]);
    }, 120);
    return () => clearInterval(interval);
  }, [spinning]);

  useEffect(() => {
    if (!spinning && resultEmoji) {
      if (resultEmoji.length > 1) {
        setSlots([resultEmoji[0] || "", resultEmoji[1] || "", resultEmoji[2] || ""]);
      } else {
        setSlots([resultEmoji, resultEmoji, resultEmoji]);
      }
      setRevealed(true);
    }
  }, [spinning, resultEmoji]);

  return (
    <div className="slot-container">
      {slots.map((emoji, i) => (
        <div
          key={i}
          className={`slot-item ${spinning ? "spinning" : ""} ${
            revealed ? "result-reveal" : ""
          }`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}
