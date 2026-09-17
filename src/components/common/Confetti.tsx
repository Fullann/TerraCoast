import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  color: string;
  shape: "rect" | "circle" | "star";
  alpha: number;
}

const CONFETTI_COLORS = [
  "#10B981", // Emerald
  "#F59E0B", // Amber / Gold
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EF4444", // Red
  "#FBBF24", // Yellow
];

export function triggerConfetti() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("terracoast:confetti"));
  }
}

export const ConfettiContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTrigger = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: Particle[] = [];
      const particleCount = 140;

      for (let i = 0; i < particleCount; i++) {
        const shapeType: "rect" | "circle" | "star" =
          i % 3 === 0 ? "star" : i % 2 === 0 ? "circle" : "rect";

        particles.push({
          x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
          y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
          w: Math.random() * 9 + 6,
          h: Math.random() * 9 + 6,
          vx: (Math.random() - 0.5) * 16,
          vy: Math.random() * -14 - 4,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          shape: shapeType,
          alpha: 1,
        });
      }

      const startTime = performance.now();
      const duration = 3800; // 3.8s

      const render = (now: number) => {
        const elapsed = now - startTime;
        if (elapsed > duration) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const fade = elapsed > duration - 1000 ? (duration - elapsed) / 1000 : 1;

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // Gravity
          p.vx *= 0.99; // Air resistance
          p.rotation += p.vRot;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.alpha * fade);
          ctx.fillStyle = p.color;

          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.w * 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === "star") {
            ctx.beginPath();
            ctx.moveTo(0, -p.h);
            ctx.lineTo(p.w * 0.3, -p.h * 0.3);
            ctx.lineTo(p.w, 0);
            ctx.lineTo(p.w * 0.3, p.h * 0.3);
            ctx.lineTo(0, p.h);
            ctx.lineTo(-p.w * 0.3, p.h * 0.3);
            ctx.lineTo(-p.w, 0);
            ctx.lineTo(-p.w * 0.3, -p.h * 0.3);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }

          ctx.restore();
        });

        animIdRef.current = requestAnimationFrame(render);
      };

      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      animIdRef.current = requestAnimationFrame(render);
    };

    window.addEventListener("terracoast:confetti", handleTrigger);
    return () => {
      window.removeEventListener("terracoast:confetti", handleTrigger);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ pointerEvents: "none" }}
    />
  );
};
