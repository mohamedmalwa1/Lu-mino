/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // primary shade (blue-600) and lighter variant (blue-500)
        primary: {
          DEFAULT: "#2563eb",
          light:   "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};

