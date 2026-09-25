export interface ShareCardData {
  title: string;
  subtitle?: string;
  playerPseudo: string;
  playerAvatar?: string | null;
  scoreDisplay: string;
  accuracyPercent?: number;
  timeTakenSeconds?: number;
  streakDays?: number;
  emojiGrid?: string;
  url?: string;
}

/**
 * Génère le texte de partage optimisé pour réseaux sociaux (WhatsApp, Twitter/X, Discord)
 */
export function generateShareText(data: ShareCardData): string {
  const url = data.url || "https://terracoast.ch";
  const streakText = data.streakDays ? ` • 🔥 Série : ${data.streakDays}j` : "";
  const timeText = data.timeTakenSeconds ? ` • ⚡ ${data.timeTakenSeconds}s` : "";

  let lines: string[] = [
    `🌍 TerraCoast | ${data.title}`,
    `👤 ${data.playerPseudo} • Score : ${data.scoreDisplay}${timeText}${streakText}`,
  ];

  if (data.emojiGrid) {
    lines.push(data.emojiGrid);
  }

  lines.push(`👉 Viens me défier sur ${url}`);
  return lines.join("\n");
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * Dessine la carte graphique sur un Canvas HTML5 (1200 x 630 pixels)
 */
export function drawShareCardOnCanvas(
  canvas: HTMLCanvasElement,
  data: ShareCardData
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 1200;
  const height = 630;
  canvas.width = width;
  canvas.height = height;

  // 1. Fond dégradé sombre et moderne
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#022c22"); // Dark emerald
  bgGrad.addColorStop(0.5, "#0f172a"); // Dark slate
  bgGrad.addColorStop(1, "#1e1b4b"); // Deep indigo
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Décorations géométriques (lueurs d'arrière-plan)
  const glow = ctx.createRadialGradient(150, 150, 10, 150, 150, 400);
  glow.addColorStop(0, "rgba(16, 185, 129, 0.2)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(width - 150, height - 150, 10, width - 150, height - 150, 400);
  glow2.addColorStop(0, "rgba(245, 158, 11, 0.15)");
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Bordure lumineuse
  ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 3. Header : Logo et Marque
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("🌍 TERRACOAST", 60, 80);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "18px sans-serif";
  ctx.fillText("Plateforme de Géographie & Quiz", 60, 110);

  // Tag en haut à droite
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  drawRoundedRect(ctx, width - 240, 50, 180, 45, 20);
  ctx.fill();

  ctx.fillStyle = "#34d399";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("terracoast.ch", width - 150, 78);
  ctx.textAlign = "left";

  // 4. Section Joueur
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.beginPath();
  drawRoundedRect(ctx, 60, 145, width - 120, 100, 24);
  ctx.fill();

  // Avatar / Emoji
  ctx.font = "50px sans-serif";
  ctx.fillText(data.playerAvatar || "👤", 85, 215);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(data.playerPseudo, 160, 190);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Explorateur TerraCoast", 160, 222);

  // 5. Bloc Central : Score + Métriques
  const scoreBoxY = 275;
  const scoreBoxH = 180;

  // Boîte Score
  ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
  ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, 60, scoreBoxY, 360, scoreBoxH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 72px sans-serif";
  ctx.fillText(data.scoreDisplay, 90, scoreBoxY + 95);

  ctx.fillStyle = "#a7f3d0";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(data.subtitle || "Performance Validée 🏆", 90, scoreBoxY + 140);

  // Stats latérales
  const statsStartX = 450;
  const statBoxW = 210;
  const statBoxH = 80;

  const stats = [
    { label: "PRÉCISION", val: `${data.accuracyPercent ?? 100}%`, icon: "🎯" },
    { label: "TEMPS", val: `${data.timeTakenSeconds ?? 0}s`, icon: "⚡" },
    { label: "SÉRIE", val: `${data.streakDays ?? 1} jours`, icon: "🔥" },
  ];

  stats.forEach((st, i) => {
    const x = statsStartX + (i % 3) * (statBoxW + 20);
    const y = scoreBoxY;

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundedRect(ctx, x, y, statBoxW, statBoxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`${st.icon} ${st.label}`, x + 18, y + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(st.val, x + 18, y + 62);
  });

  // Grille d'émojis visuelle en dessous
  if (data.emojiGrid) {
    const gridY = scoreBoxY + 105;
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    drawRoundedRect(ctx, statsStartX, gridY, 670, 75, 16);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "32px sans-serif";
    ctx.fillText(data.emojiGrid, statsStartX + 20, gridY + 50);
  }

  // 6. Footer Call-to-action
  ctx.fillStyle = "#64748b";
  ctx.font = "16px sans-serif";
  ctx.fillText("Prêt à relever le défi ? Rejoins des milliers de passionnés de géographie !", 60, 560);

  ctx.fillStyle = "#10b981";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("👉 https://terracoast.ch", 60, 590);
}

/**
 * Exporte le Canvas en Blob PNG
 */
export function exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Télécharge l'image générée en fichier PNG
 */
export function downloadCanvasImage(canvas: HTMLCanvasElement, filename = "terracoast-score.png"): void {
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Copie l'image Canvas directement dans le presse-papier
 */
export async function copyCanvasImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.clipboard || !("write" in navigator.clipboard)) {
    return false;
  }

  try {
    const blob = await exportCanvasToBlob(canvas);
    if (!blob) return false;

    // ClipboardItem API
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error("Impossible de copier l'image dans le presse-papier :", err);
    return false;
  }
}

/**
 * Partage via la Web Share API native sur mobile (iOS / Android)
 */
export async function shareViaWebShareApi(
  canvas: HTMLCanvasElement,
  data: ShareCardData
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }

  try {
    const blob = await exportCanvasToBlob(canvas);
    if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], "terracoast-score.png", { type: "image/png" })] })) {
      const file = new File([blob], "terracoast-score.png", { type: "image/png" });
      await navigator.share({
        title: `TerraCoast : ${data.title}`,
        text: generateShareText(data),
        files: [file],
      });
      return true;
    }

    // Fallback texte si partage de fichier non supporté
    await navigator.share({
      title: `TerraCoast : ${data.title}`,
      text: generateShareText(data),
      url: data.url || "https://terracoast.ch",
    });
    return true;
  } catch {
    return false;
  }
}
