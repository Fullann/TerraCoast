import { useState, useEffect, type CSSProperties } from "react";
import { User } from "lucide-react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type FrameStyle =
  | "none"
  | "emerald"
  | "gold"
  | "rainbow"
  | "ice"
  | "shadow"
  | "flame"
  | "frame_flame"
  | "compass"
  | "frame_compass"
  | "crown"
  | "frame_crown";

export interface AvatarProps {
  url?: string | null;
  pseudo?: string | null;
  frameStyle?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { px: number; text: string }> = {
  xs: { px: 28, text: "text-[11px]" },
  sm: { px: 36, text: "text-xs" },
  md: { px: 48, text: "text-sm" },
  lg: { px: 64, text: "text-base" },
  xl: { px: 88, text: "text-lg" },
};

function initialsFromPseudo(pseudo?: string | null) {
  const s = (pseudo || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : (parts[0]?.[1] || "");
  return (a + b).toUpperCase();
}

function normalizeFrameStyle(frameStyle?: string | null): FrameStyle {
  const v = (frameStyle || "none").toLowerCase().trim();
  if (
    v === "none" ||
    v === "emerald" ||
    v === "gold" ||
    v === "rainbow" ||
    v === "ice" ||
    v === "shadow" ||
    v === "flame" ||
    v === "frame_flame" ||
    v === "compass" ||
    v === "frame_compass" ||
    v === "crown" ||
    v === "frame_crown"
  ) {
    return v as FrameStyle;
  }
  return "none";
}

function frameClass(style: FrameStyle) {
  switch (style) {
    case "emerald":
      return "ring-2 ring-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.14)]";
    case "gold":
      return "ring-2 ring-yellow-400 shadow-[0_0_0_6px_rgba(250,204,21,0.18)]";
    case "ice":
      return "ring-2 ring-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.18)]";
    case "shadow":
      return "ring-2 ring-gray-300 shadow-lg";
    case "rainbow":
      return "ring-2 ring-transparent bg-gradient-to-br from-pink-200 via-amber-200 to-sky-200 p-[2px]";
    case "flame":
    case "frame_flame":
      return "ring-2 ring-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)] animate-pulse";
    case "compass":
    case "frame_compass":
      return "ring-2 ring-teal-400 ring-offset-2 ring-offset-teal-900 shadow-[0_0_10px_rgba(45,212,191,0.5)]";
    case "crown":
    case "frame_crown":
      return "ring-4 ring-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.7)] drop-shadow-md";
    default:
      return "ring-1 ring-gray-200";
  }
}

export function Avatar({
  url,
  pseudo,
  frameStyle,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [url]);

  const { px, text } = sizeMap[size];
  const initials = initialsFromPseudo(pseudo);
  const style = normalizeFrameStyle(frameStyle);

  const outerClasses = `rounded-full ${frameClass(style)}`;
  const innerClasses = "rounded-full bg-white";
  const outerStyle: CSSProperties = { width: px, height: px };

  return (
    <div className={`${outerClasses} ${className}`} style={outerStyle}>
      <div className={`${innerClasses} w-full h-full overflow-hidden flex items-center justify-center`}>
        {url && !imgFailed ? (
          <img
            src={url}
            alt={pseudo || "avatar"}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : initials ? (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-800 font-bold ${text}`}>
            {initials}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
            <User className="w-1/2 h-1/2" />
          </div>
        )}
      </div>
    </div>
  );
}

