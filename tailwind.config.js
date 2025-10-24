/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f1f5ff",
          100: "#e6eeff",
          200: "#cddcff",
          300: "#a7c1ff",
          400: "#6e98ff",
          500: "#3d72ff",
          600: "#2558e6",
          700: "#1d45b4",
          800: "#193b95",
          900: "#152f74",
        },
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 6px 24px rgba(0,0,0,0.06)",
        "card-lg": "0 12px 32px rgba(0,0,0,0.08)",
      },
      fontSize: {
        "display": 28,
        "h1": 22,
        "h2": 18,
      },
    },
  },
  plugins: [],
};
