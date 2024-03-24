/** @type {import('tailwindcss').Config} */
export default {
  content: ["src/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: "var(--montserrat)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      screens: {
        ssm: { min: "900px", max: "1169px" },
        mo: { max: "900px" },
        md: [{ min: "900px", max: "1280px" }],
        sm: { min: "900px" },
      },
      width: {
        container: "1280px",
      },
      textColor: {
        primary: "#FC7823",
      },
      borderColor: {
        primary: "#FC7823",
      },
      backgroundColor: {
        primary: "#FC7823",
      },
    },
  },
  plugins: [],
};
