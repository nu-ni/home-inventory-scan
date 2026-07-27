// Zentrale Design-Tokens. Bewusst klein gehalten für den Prototyp,
// aber an einer Stelle gebündelt, damit ein späteres Redesign nicht
// 30 Screens einzeln anfassen muss.

export const colors = {
  background: "#F7F6F3",
  surface: "#FFFFFF",
  surfaceAlt: "#EFEDE7",
  border: "#E3E0D8",

  text: "#1C1B19",
  textMuted: "#6B6862",

  primary: "#2B6E5E", // gedecktes Salbeigrün – wirkt "Zuhause/Versicherung", nicht wie ein Tech-Startup
  primaryText: "#FFFFFF",
  accent: "#C97A3D", // warmer Terracotta-Akzent für CTAs/Badges

  success: "#3A8A5E",
  warning: "#C9A23D",
  danger: "#C9503D",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: "700" as const },
  heading: { fontSize: 20, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
};
