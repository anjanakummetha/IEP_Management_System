import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        toasty:         "#D9A883",
        "espresso-foam":"#A98062",
        mocha:          "#956643",
        "cold-brew":    "#623528",
        "espresso-noir":"#343434",
        vanilla:        "#FAF6F0",
        // keep sand for subtle fills
        sand:           "#EDE4D8",
      },
    },
  },
  plugins: [],
};

export default config;
