const colors = {
  primary: "#4CAF50",
  secondary: "#2196F3",
  paper: "#FFC107",
  plastic: "#2196F3",
  metal: "#9E9E9E",
  glass: "#00BCD4",
  other: "#FF5722",
  background: "#F5F5F5",
  text: "#212121",
  textLight: "#FFFFFF",
  success: "#4CAF50",
  error: "#F44336",
} as const;

export type Colors = typeof colors;
export default colors;
