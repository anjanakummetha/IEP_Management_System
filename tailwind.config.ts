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
        vanilla: "#F1EADA",
        tobacco: "#B59E7D",
        mountain: "#AAA396",
        mahogany: "#584738",
        sand: "#CEC1A8",
      },
    },
  },
  plugins: [],
};

export default config;
