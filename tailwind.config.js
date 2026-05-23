/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2F6F4F",
        secondary: "#2F80ED",
        paper: "#C98B2E",
        plastic: "#2D9CDB",
        metal: "#667085",
        glass: "#1FA7A0",
        other: "#D96C3F",
        background: "#F4F1E8",
        surface: "#FFFDF8",
        border: "#E6DDCF",
        brand: {
          text: "#18211B",
          muted: "#667068",
        },
      },
    },
  },
  plugins: [],
};
