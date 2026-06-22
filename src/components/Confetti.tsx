"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#f97316", "#14b8a6", "#eab308", "#6366f1",
];

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }
    const arr: Piece[] = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.8,
        duration: 1.5 + Math.random() * 2,
        size: 6 + Math.random() * 8,
      });
    }
    setPieces(arr);
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
