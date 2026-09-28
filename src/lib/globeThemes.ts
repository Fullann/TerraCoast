/**
 * Configuration des textures et styles visuels du Globe 3D selon le thème équipé ou le calque sélectionné
 */

export interface GlobeThemeConfig {
  id: string;
  name: string;
  globeImageUrl: string;
  bumpImageUrl?: string;
  backgroundColor?: string;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  canvasFilter?: string;
}

export type GlobeLayerType = "political" | "satellite" | "relief" | "night";

export interface GlobeLayerOption {
  id: GlobeLayerType;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  themeConfig: GlobeThemeConfig;
}

export const GLOBE_LAYER_OPTIONS: GlobeLayerOption[] = [
  {
    id: "political",
    label: "Vue Politique & Frontières",
    shortLabel: "Politique",
    icon: "🗺️",
    description: "Contours nets des pays et capitales",
    themeConfig: {
      id: "political",
      name: "Vue Politique & Frontières 🗺️",
      globeImageUrl: "//unpkg.com/three-globe/example/img/earth-dark.jpg",
      bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
      atmosphereColor: "#10b981",
      atmosphereAltitude: 0.15,
      canvasFilter: "contrast(1.15) brightness(1.1)",
    },
  },
  {
    id: "satellite",
    label: "Vue Satellite Réelle HD",
    shortLabel: "Satellite HD",
    icon: "🛰️",
    description: "Texture Blue Marble de la NASA",
    themeConfig: {
      id: "satellite",
      name: "Vue Satellite Réelle HD 🛰️",
      globeImageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
      atmosphereColor: "#38bdf8",
      atmosphereAltitude: 0.18,
    },
  },
  {
    id: "relief",
    label: "Vue Relief & Topographie",
    shortLabel: "Relief & Topo",
    icon: "🏔️",
    description: "Élévations des chaînes de montagnes et fosses",
    themeConfig: {
      id: "relief",
      name: "Vue Relief & Topographie 🏔️",
      globeImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
      bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
      atmosphereColor: "#f59e0b",
      atmosphereAltitude: 0.14,
      canvasFilter: "contrast(1.3) saturate(1.2) sepia(0.15)",
    },
  },
  {
    id: "night",
    label: "Vue Nocturne (Mégalopoles)",
    shortLabel: "Nocturne",
    icon: "🌃",
    description: "Lumières dorées des grandes métropoles",
    themeConfig: {
      id: "night",
      name: "Vue Nocturne 🌃",
      globeImageUrl: "//unpkg.com/three-globe/example/img/earth-night.jpg",
      bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
      atmosphereColor: "#818cf8",
      atmosphereAltitude: 0.22,
    },
  },
];

export const GLOBE_THEMES: Record<string, GlobeThemeConfig> = {
  default: {
    id: "default",
    name: "Bleu Marbre Naturel 🌍",
    globeImageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
    atmosphereColor: "#3b82f6",
    atmosphereAltitude: 0.15,
  },
  theme_antique: {
    id: "theme_antique",
    name: "Parchemin Antique 📜",
    globeImageUrl: "//unpkg.com/three-globe/example/img/earth-dark.jpg",
    bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
    atmosphereColor: "#d97706",
    atmosphereAltitude: 0.12,
    canvasFilter: "sepia(0.85) contrast(1.15) brightness(1.1) hue-rotate(15deg)",
  },
  theme_night: {
    id: "theme_night",
    name: "Satellite Nocturne 🌃",
    globeImageUrl: "//unpkg.com/three-globe/example/img/earth-night.jpg",
    bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
    atmosphereColor: "#818cf8",
    atmosphereAltitude: 0.2,
  },
  theme_cyberpunk: {
    id: "theme_cyberpunk",
    name: "Néon Cyberpunk 👾",
    globeImageUrl: "//unpkg.com/three-globe/example/img/earth-dark.jpg",
    bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
    atmosphereColor: "#10b981",
    atmosphereAltitude: 0.25,
    canvasFilter: "hue-rotate(140deg) saturate(2.5) contrast(1.3)",
  },
};

export function getGlobeThemeConfig(themeId?: string): GlobeThemeConfig {
  if (!themeId || !GLOBE_THEMES[themeId]) {
    return GLOBE_THEMES.default;
  }
  return GLOBE_THEMES[themeId];
}
