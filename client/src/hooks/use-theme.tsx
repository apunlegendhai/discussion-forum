import React, { createContext, useContext, useState, useEffect } from "react";

// Converting to JS per requirement, but keeping basic type hints in comments
// type Theme = "light" | "dark";
// type ThemeContextType = { theme: Theme; toggleTheme: () => void; };

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') return 'light';
    
    // Check if a theme is stored in localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    
    // Otherwise check user's system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    
    // Default to light mode
    return "light";
  });

  // Update the HTML theme classes when the theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Update background explicitly for full page theme
    if (theme === 'dark') {
      document.body.style.backgroundColor = 'hsl(222.2 84% 4.9%)';
    } else {
      document.body.style.backgroundColor = 'hsl(0 0% 100%)';
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}