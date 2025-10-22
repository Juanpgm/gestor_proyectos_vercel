/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      // Breakpoints específicos para tablets
      tablet: "768px",
      "tablet-lg": "1024px",
      // iPad específico (768x1024 y 1024x768)
      "ipad-portrait": {
        raw: "(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)",
      },
      "ipad-landscape": {
        raw: "(min-width: 768px) and (max-width: 1366px) and (orientation: landscape)",
      },
      // iPad Pro (1024x1366 y 1366x1024)
      "ipad-pro-portrait": {
        raw: "(min-width: 1024px) and (max-width: 1366px) and (orientation: portrait)",
      },
      "ipad-pro-landscape": {
        raw: "(min-width: 1024px) and (max-width: 1500px) and (orientation: landscape)",
      },
      // Touch device detection
      touch: { raw: "(hover: none) and (pointer: coarse)" },
      "no-touch": { raw: "(hover: hover) and (pointer: fine)" },
    },
    extend: {
      colors: {
        // Sistema de colores principal
        projects: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        units: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          800: "#065f46",
          900: "#064e3b",
        },
        activities: {
          50: "#fef2f2",
          100: "#fee2e2",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        products: {
          50: "#fff7ed",
          100: "#fed7aa",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        contracts: {
          50: "#f5f3ff",
          100: "#ede9fe",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        // Colores legacy mantenidos por compatibilidad
        "cali-blue": "#2563eb",
        "cali-green": "#059669",
        "cali-orange": "#ea580c",
        "cali-red": "#dc2626",
        "cali-yellow": "#f59e0b",
        "cali-purple": "#7c3aed",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        // Espacios específicos para tablets
        "tablet-padding": "1.5rem",
        "tablet-margin": "1rem",
        "touch-target": "44px", // Tamaño mínimo recomendado para elementos táctiles
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        // Tamaños específicos para tablets
        "tablet-xs": ["0.875rem", { lineHeight: "1.25rem" }],
        "tablet-sm": ["1rem", { lineHeight: "1.5rem" }],
        "tablet-base": ["1.125rem", { lineHeight: "1.75rem" }],
        "tablet-lg": ["1.25rem", { lineHeight: "1.75rem" }],
        "tablet-xl": ["1.375rem", { lineHeight: "1.875rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
        "slide-down": "slideDown 0.6s ease-out",
        "slide-left": "slideLeft 0.6s ease-out",
        "slide-right": "slideRight 0.6s ease-out",
        "scale-up": "scaleUp 0.3s ease-out",
        "bounce-in": "bounceIn 0.6s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleUp: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      lineClamp: {
        7: "7",
        8: "8",
        9: "9",
        10: "10",
      },
      // Aspectos de ratio específicos para diferentes orientaciones
      aspectRatio: {
        "ipad-portrait": "3/4",
        "ipad-landscape": "4/3",
        wide: "16/9",
      },
      // Grid específicos para tablets
      gridTemplateColumns: {
        tablet: "repeat(auto-fit, minmax(280px, 1fr))",
        "tablet-cards": "repeat(auto-fit, minmax(320px, 1fr))",
      },
      // Utilidades para interacción táctil
      cursor: {
        touch: "pointer",
      },
    },
  },
  plugins: [
    // Plugin para line-clamp
    function ({ addUtilities }) {
      const newUtilities = {
        ".line-clamp-1": {
          overflow: "hidden",
          display: "-webkit-box",
          "-webkit-box-orient": "vertical",
          "-webkit-line-clamp": "1",
        },
        ".line-clamp-2": {
          overflow: "hidden",
          display: "-webkit-box",
          "-webkit-box-orient": "vertical",
          "-webkit-line-clamp": "2",
        },
        ".line-clamp-3": {
          overflow: "hidden",
          display: "-webkit-box",
          "-webkit-box-orient": "vertical",
          "-webkit-line-clamp": "3",
        },
      };
      addUtilities(newUtilities);
    },
    // Plugin para utilidades específicas de tablets
    function ({ addUtilities, addComponents, theme }) {
      const tabletUtilities = {
        // Utilidades para elementos táctiles
        ".touch-target": {
          "min-height": theme("spacing.touch-target"),
          "min-width": theme("spacing.touch-target"),
        },
        ".touch-friendly": {
          padding: theme("spacing.3"),
          margin: theme("spacing.1"),
          "border-radius": theme("borderRadius.lg"),
        },
        // Contenedores responsivos para tablets
        ".tablet-container": {
          "padding-left": theme("spacing.tablet-padding"),
          "padding-right": theme("spacing.tablet-padding"),
        },
        ".tablet-grid": {
          display: "grid",
          "grid-template-columns": theme("gridTemplateColumns.tablet"),
          gap: theme("spacing.4"),
        },
        ".tablet-card-grid": {
          display: "grid",
          "grid-template-columns": theme("gridTemplateColumns.tablet-cards"),
          gap: theme("spacing.6"),
        },
        // Utilidades para orientación
        ".landscape-only": {
          "@media (orientation: portrait)": {
            display: "none",
          },
        },
        ".portrait-only": {
          "@media (orientation: landscape)": {
            display: "none",
          },
        },
        // Espaciado responsivo para tablets
        ".tablet-spacing": {
          "@media (min-width: 768px) and (max-width: 1024px)": {
            padding: theme("spacing.6"),
            margin: theme("spacing.4"),
          },
        },
      };

      addUtilities(tabletUtilities);

      const tabletComponents = {
        ".btn-tablet": {
          padding: `${theme("spacing.3")} ${theme("spacing.6")}`,
          "font-size": theme("fontSize.tablet-base[0]"),
          "line-height": theme("fontSize.tablet-base[1].lineHeight"),
          "border-radius": theme("borderRadius.lg"),
          "min-height": theme("spacing.touch-target"),
          "min-width": theme("spacing.touch-target"),
          display: "inline-flex",
          "align-items": "center",
          "justify-content": "center",
          gap: theme("spacing.2"),
          transition: "all 0.2s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "scale(1.02)",
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        ".card-tablet": {
          padding: theme("spacing.6"),
          "border-radius": theme("borderRadius.xl"),
          "box-shadow": theme("boxShadow.lg"),
          "background-color": "white",
          border: `1px solid ${theme("colors.gray.200")}`,
          "min-height": theme("spacing.32"),
          transition: "all 0.3s ease",
          "&:hover": {
            "box-shadow": theme("boxShadow.xl"),
            transform: "translateY(-2px)",
          },
        },
        ".input-tablet": {
          padding: theme("spacing.4"),
          "font-size": theme("fontSize.tablet-base[0]"),
          "line-height": theme("fontSize.tablet-base[1].lineHeight"),
          "border-radius": theme("borderRadius.lg"),
          "min-height": theme("spacing.touch-target"),
          border: `2px solid ${theme("colors.gray.300")}`,
          "&:focus": {
            "border-color": theme("colors.blue.500"),
            outline: "none",
            "box-shadow": `0 0 0 3px ${theme("colors.blue.100")}`,
          },
        },
      };

      addComponents(tabletComponents);
    },
  ],
};
