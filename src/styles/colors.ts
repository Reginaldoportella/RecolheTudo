const colors = {
  primary: "#2F6F4F",
  primaryStrong: "#1F5338",
  primarySoft: "#DDEEDF",
  secondary: "#2F80ED",
  secondarySoft: "#DCEBFF",
  accent: "#F2B441",
  accentSoft: "#FFF3D9",
  paper: "#C98B2E",
  plastic: "#2D9CDB",
  metal: "#667085",
  glass: "#1FA7A0",
  other: "#D96C3F",
  background: "#F4F1E8",
  surface: "#FFFDF8",
  surfaceMuted: "#F7F2E8",
  border: "#E6DDCF",
  text: "#18211B",
  textMuted: "#667068",
  textLight: "#FFFFFF",
  success: "#2F6F4F",
  warning: "#D9A441",
  error: "#C94F4F",
  shadow: "rgba(24, 33, 27, 0.12)",
} as const;

export type Colors = typeof colors;
export default colors;
