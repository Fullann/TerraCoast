import type { TerraCard } from "./cardsData";
import type { PlayerCardEntry } from "./cardsManager";

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

/**
 * 🎴 Dessine une Carte Collector Pokédex Géographique en haute définition (800 x 1100 px)
 */
export function drawConquestCollectorCard(
  canvas: HTMLCanvasElement,
  card: {
    iso3: string;
    name: string;
    capital: string;
    flagEmoji: string;
    continent: string;
    population: number;
    areaKm2: number;
    rarity: "common" | "rare" | "epic" | "legendary";
    landmark: { name: string; icon: string; description: string };
    funFact: string;
    isConquered: boolean;
    conqueredAt?: string | null;
  },
  playerPseudo?: string
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = 800;
  const h = 1100;
  canvas.width = w;
  canvas.height = h;

  // 1. Dégradé de la bordure holographique selon la rareté
  const borderGrad = ctx.createLinearGradient(0, 0, w, h);
  let themeColor = "#10b981";
  let rarityLabel = "COMMUNE 🧭";

  if (card.rarity === "legendary") {
    borderGrad.addColorStop(0, "#fef08a");
    borderGrad.addColorStop(0.3, "#f59e0b");
    borderGrad.addColorStop(0.7, "#fbbf24");
    borderGrad.addColorStop(1, "#b45309");
    themeColor = "#fbbf24";
    rarityLabel = "LÉGENDAIRE ⭐";
  } else if (card.rarity === "epic") {
    borderGrad.addColorStop(0, "#f0abfc");
    borderGrad.addColorStop(0.3, "#a855f7");
    borderGrad.addColorStop(0.7, "#c084fc");
    borderGrad.addColorStop(1, "#6366f1");
    themeColor = "#c084fc";
    rarityLabel = "ÉPIQUE 💎";
  } else if (card.rarity === "rare") {
    borderGrad.addColorStop(0, "#bae6fd");
    borderGrad.addColorStop(0.3, "#0ea5e9");
    borderGrad.addColorStop(0.7, "#38bdf8");
    borderGrad.addColorStop(1, "#0284c7");
    themeColor = "#38bdf8";
    rarityLabel = "RARE 🔷";
  } else {
    borderGrad.addColorStop(0, "#a7f3d0");
    borderGrad.addColorStop(0.3, "#10b981");
    borderGrad.addColorStop(0.7, "#34d399");
    borderGrad.addColorStop(1, "#0f766e");
    themeColor = "#34d399";
    rarityLabel = "COMMUNE 🧭";
  }

  // Fond externe (bordure foil de 16px)
  ctx.fillStyle = borderGrad;
  ctx.fillRect(0, 0, w, h);

  // Reflet holographique en diagonale
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(0, h / 2);
  ctx.fill();

  // 2. Corps intérieur de la carte (fond sombre texturé)
  const margin = 16;
  ctx.fillStyle = "#090d16";
  ctx.beginPath();
  drawRoundedRect(ctx, margin, margin, w - margin * 2, h - margin * 2, 28);
  ctx.fill();

  // Lueur centrale intérieure
  const innerGlow = ctx.createRadialGradient(w / 2, 350, 20, w / 2, 350, 400);
  innerGlow.addColorStop(0, `${themeColor}22`);
  innerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = innerGlow;
  ctx.fillRect(margin, margin, w - margin * 2, h - margin * 2);

  // 3. Header Carte : Rareté et Titre
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("TERRACOAST • POKÉDEX GÉOGRAPHIQUE", 50, 65);

  ctx.fillStyle = themeColor;
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${rarityLabel} • #${card.iso3}`, w - 50, 65);
  ctx.textAlign = "left";

  // Ligne de séparation
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 85);
  ctx.lineTo(w - 50, 85);
  ctx.stroke();

  // 4. Hero Box (Drapeau + Nom)
  const heroY = 110;
  const heroH = 260;
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = `${themeColor}55`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, 50, heroY, w - 100, heroH, 24);
  ctx.fill();
  ctx.stroke();

  // Cercle drapeau
  ctx.font = "100px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(card.flagEmoji, w / 2, heroY + 115);

  // Nom du pays
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(card.name, w / 2, heroY + 185);

  // Capitale & Continent
  ctx.fillStyle = themeColor;
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(`Capitale : ${card.capital} • ${card.continent}`, w / 2, heroY + 225);
  ctx.textAlign = "left";

  // 5. Statistiques Clés (3 colonnes)
  const statsY = 395;
  const colW = (w - 100 - 30) / 3;
  const colH = 95;

  const statItems = [
    { label: "👥 POPULATION", val: `${(card.population / 1_000_000).toFixed(1)}M hab.` },
    { label: "🧭 SUPERFICIE", val: `${card.areaKm2.toLocaleString("fr-FR")} km²` },
    { label: "👑 STATUT", val: card.isConquered ? "Conquis 100%" : "En cours" },
  ];

  statItems.forEach((st, i) => {
    const x = 50 + i * (colW + 15);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundedRect(ctx, x, statsY, colW, colH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(st.label, x + 16, statsY + 32);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(st.val, x + 16, statsY + 68);
  });

  // 6. Monument Emblématique
  const monY = 515;
  const monH = 180;
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = `${themeColor}44`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, 50, monY, w - 100, monH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.font = "40px sans-serif";
  ctx.fillText(card.landmark.icon || "🏛️", 75, monY + 65);

  ctx.fillStyle = themeColor;
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(card.landmark.name, 135, monY + 50);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "17px sans-serif";
  ctx.fillText("Monument & Trésor National", 135, monY + 75);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px sans-serif";
  const desc = card.landmark.description || "Un site d'une importance culturelle majeure.";
  ctx.fillText(desc.slice(0, 75) + (desc.length > 75 ? "..." : ""), 75, monY + 125);
  if (desc.length > 75) {
    ctx.fillText(desc.slice(75, 150), 75, monY + 152);
  }

  // 7. Anecdote / Fun Fact
  const factY = 720;
  const factH = 195;
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, 50, factY, w - 100, factH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("💡 Le saviez-vous ?", 75, factY + 45);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "italic 18px sans-serif";
  const words = (card.funFact || "Ce pays regorge d'anecdotes géographiques fascinantes.").split(" ");
  let line = "";
  let curY = factY + 80;
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > w - 150) {
      ctx.fillText(line, 75, curY);
      line = word + " ";
      curY += 28;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 75, curY);

  // 8. Footer Collector & Signature
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText(`🎮 Collectionné par : ${playerPseudo || "Explorateur"}`, 50, 975);

  ctx.fillStyle = themeColor;
  ctx.font = "bold 17px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("🌍 terracoast.ch", w - 50, 975);
  ctx.textAlign = "left";

  ctx.fillStyle = "#475569";
  ctx.font = "14px sans-serif";
  ctx.fillText("Carte holographique officielle générée sur TerraCoast", 50, 1010);
}

/**
 * 🎴 Génère une image PNG haute résolution d'une carte TerraDex pour partage réseaux sociaux
 */
export async function renderTerraCardShareCanvas(
  card: TerraCard,
  entry?: PlayerCardEntry,
  playerPseudo?: string
): Promise<string> {
  const canvas = document.createElement("canvas");
  const w = 720;
  const h = 1000;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Rareté & Couleurs
  const rarityColors: Record<string, { main: string; glow: string; label: string }> = {
    common: { main: "#94a3b8", glow: "#64748b", label: "COMMUNE ★" },
    rare: { main: "#38bdf8", glow: "#0284c7", label: "RARE ★★" },
    epic: { main: "#c084fc", glow: "#9333ea", label: "ÉPIQUE ★★★" },
    legendary: { main: "#fbbf24", glow: "#d97706", label: "LÉGENDAIRE ★★★★" },
    mythic: { main: "#f472b6", glow: "#db2777", label: "MYTHIQUE ★★★★★" },
  };
  const rarity = rarityColors[card.rarity] || rarityColors.common;
  const isShiny = Boolean(entry?.shiny);

  // 1. Fond sombre luxueux dégradé
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#090d16");
  bgGrad.addColorStop(0.5, "#0f172a");
  bgGrad.addColorStop(1, "#020617");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Halo d'ambiance cosmique centré
  const glowGrad = ctx.createRadialGradient(w / 2, 280, 50, w / 2, 280, 360);
  glowGrad.addColorStop(0, isShiny ? "rgba(244, 114, 182, 0.25)" : `${rarity.glow}33`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // 3. Cadre orné extérieur
  ctx.strokeStyle = isShiny ? "#fbcfe8" : rarity.main;
  ctx.lineWidth = 4;
  ctx.beginPath();
  drawRoundedRect(ctx, 30, 30, w - 60, h - 60, 28);
  ctx.stroke();

  // Filet intérieur subtil
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, 42, 42, w - 84, h - 84, 20);
  ctx.stroke();

  // 4. En-tête : Numéro Pokédex + Badge TerraDex + Rareté
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 20px monospace";
  const cardNum = `#${String(card.number).padStart(3, "0")}`;
  ctx.fillText(`🎴 TerraDex • ${cardNum}`, 60, 78);

  ctx.textAlign = "right";
  ctx.fillStyle = isShiny ? "#ec4899" : rarity.main;
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(isShiny ? `✨ HOLO FOIL • ${rarity.label}` : rarity.label, w - 60, 78);
  ctx.textAlign = "left";

  // 5. Médaillon central 3D
  const boxY = 110;
  const boxH = 260;
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = `${rarity.main}55`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, 60, boxY, w - 120, boxH, 24);
  ctx.fill();
  ctx.stroke();

  // Symbole central (drapeau ou icône)
  ctx.font = "95px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(card.flag || card.icon, w / 2, boxY + 115);

  // Nom de la carte
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(card.name, w / 2, boxY + 185);

  // Slogan
  ctx.fillStyle = isShiny ? "#f472b6" : rarity.main;
  ctx.font = "italic 19px sans-serif";
  ctx.fillText(`« ${card.tagline} »`, w / 2, boxY + 225);
  ctx.textAlign = "left";

  // 6. Données Cartographiques (Stats)
  const statsY = 400;
  const statsEntries = Object.entries(card.stats).slice(0, 4);
  const colW = (w - 120 - 15) / 2;
  const rowH = 75;

  statsEntries.forEach(([k, v], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 60 + col * (colW + 15);
    const y = statsY + row * (rowH + 12);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundedRect(ctx, x, y, colW, rowH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(k.replace(/_/g, " "), x + 16, y + 28);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(String(v), x + 16, y + 56);
  });

  // 7. Anecdote / Le saviez-vous ?
  const factY = 600;
  const factH = 260;
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, 60, factY, w - 120, factH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("💡 Le Saviez-vous ?", 85, factY + 45);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "18px sans-serif";
  const words = (card.funFact || card.description).split(" ");
  let curLine = "";
  let textY = factY + 85;
  for (const word of words) {
    const testLine = curLine + word + " ";
    if (ctx.measureText(testLine).width > w - 170) {
      ctx.fillText(curLine, 85, textY);
      curLine = word + " ";
      textY += 30;
    } else {
      curLine = testLine;
    }
  }
  ctx.fillText(curLine, 85, textY);

  // 8. Footer Collector & Signature
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText(`🎮 Collectionné par : ${playerPseudo || "Explorateur"}`, 60, 920);

  ctx.fillStyle = rarity.main;
  ctx.font = "bold 17px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("🌍 terracoast.ch", w - 60, 920);
  ctx.textAlign = "left";

  ctx.fillStyle = "#475569";
  ctx.font = "14px sans-serif";
  ctx.fillText("Carte officielle TerraDex • Géographie mondiale & TCG", 60, 945);

  return canvas.toDataURL("image/png");
}
