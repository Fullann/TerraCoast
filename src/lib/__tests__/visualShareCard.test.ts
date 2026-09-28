import { describe, it, expect, vi } from "vitest";
import { generateShareText, drawShareCardOnCanvas, type ShareCardData } from "../visualShareCard";

describe("visualShareCard engine", () => {
  const sampleData: ShareCardData = {
    title: "Défi Quotidien #42",
    subtitle: "Score Parfait 🏆",
    playerPseudo: "AtlasExplorer",
    playerAvatar: "🌍",
    scoreDisplay: "100%",
    accuracyPercent: 100,
    timeTakenSeconds: 18,
    streakDays: 7,
    emojiGrid: "🟩 🟩 🟩 🟩 🟩",
  };

  it("generates optimized viral share text with emojis", () => {
    const text = generateShareText(sampleData);
    expect(text).toContain("🌍 TerraCoast");
    expect(text).toContain("Défi Quotidien #42");
    expect(text).toContain("AtlasExplorer");
    expect(text).toContain("100%");
    expect(text).toContain("⚡ 18s");
    expect(text).toContain("🔥 Série : 7j");
    expect(text).toContain("🟩 🟩 🟩 🟩 🟩");
    expect(text).toContain("https://terracoast.ch");
  });

  it("handles share text without optional fields gracefully", () => {
    const minimalData: ShareCardData = {
      title: "Quiz Rapide",
      playerPseudo: "Guest",
      scoreDisplay: "80%",
    };
    const text = generateShareText(minimalData);
    expect(text).toContain("Quiz Rapide");
    expect(text).toContain("Guest");
    expect(text).toContain("80%");
  });

  it("draws properly on canvas 2d context", () => {
    const fillRectMock = vi.fn();
    const fillTextMock = vi.fn();
    const strokeRectMock = vi.fn();
    const beginPathMock = vi.fn();
    const fillMock = vi.fn();
    const strokeMock = vi.fn();

    const mockCtx = {
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      createRadialGradient: () => ({ addColorStop: vi.fn() }),
      fillRect: fillRectMock,
      fillText: fillTextMock,
      strokeRect: strokeRectMock,
      beginPath: beginPathMock,
      fill: fillMock,
      stroke: strokeMock,
      roundRect: vi.fn(),
    } as any;

    const mockCanvas = {
      getContext: () => mockCtx,
      width: 0,
      height: 0,
    } as any;

    drawShareCardOnCanvas(mockCanvas, sampleData);

    expect(mockCanvas.width).toBe(1200);
    expect(mockCanvas.height).toBe(630);
    expect(fillTextMock).toHaveBeenCalled();
  });

  it("draws holographic collector card for conquest properly", async () => {
    const { drawConquestCollectorCard } = await import("../visualShareCard");
    const fillRectMock = vi.fn();
    const fillTextMock = vi.fn();
    const mockCtx = {
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      createRadialGradient: () => ({ addColorStop: vi.fn() }),
      fillRect: fillRectMock,
      fillText: fillTextMock,
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      roundRect: vi.fn(),
      measureText: () => ({ width: 100 }),
    } as any;

    const mockCanvas = {
      getContext: () => mockCtx,
      width: 0,
      height: 0,
    } as any;

    const mockCard = {
      iso3: "FRA",
      name: "France",
      officialName: "République française",
      capital: "Paris",
      continent: "Europe",
      flagEmoji: "🇫🇷",
      rarity: "legendary" as const,
      population: 68000000,
      areaKm2: 551695,
      currencies: [{ name: "Euro", symbol: "€" }],
      landmark: {
        name: "Tour Eiffel",
        description: "Monument emblématique de Paris.",
        icon: "🗼",
      },
      funFact: "Le pays le plus visité au monde.",
      isConquered: true,
      bestAccuracy: 100,
    };

    drawConquestCollectorCard(mockCanvas, mockCard as any, "PikachuTrainer");

    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(1100);
    expect(fillTextMock).toHaveBeenCalled();
  });
});
