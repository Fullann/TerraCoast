import type { CSSProperties } from "react";
import { User } from "lucide-react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type FrameStyle =
  | "none"
  | "emerald"
  | "gold"
  | "rainbow"
  | "ice"
  | "shadow";

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
    v === "shadow"
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
  const { px, text } = sizeMap[size];
  const initials = initialsFromPseudo(pseudo);
  const style = normalizeFrameStyle(frameStyle);

  const outerClasses =
    style === "rainbow"
      ? `rounded-full ${frameClass(style)}`
      : `rounded-full ${frameClass(style)}`;

  const innerClasses =
    style === "rainbow"
      ? "rounded-full bg-white"
      : "rounded-full bg-white";

  const outerStyle: CSSProperties = { width: px, height: px };

  return (
    <div className={`${outerClasses} ${className}`} style={outerStyle}>
      <div className={`${innerClasses} w-full h-full overflow-hidden flex items-center justify-center`}>
        {url ? (
          <img
            src={url}
            alt={pseudo || "avatar"}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : initials ? (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 font-bold ${text}`}>
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

