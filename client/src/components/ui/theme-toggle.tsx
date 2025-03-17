import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative h-9 w-9 rounded-md transition-colors hover:bg-muted"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative">
        <Sun
          className={`h-5 w-5 transition-all ${
            theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <Moon
          className={`absolute top-0 left-0 h-5 w-5 transition-all ${
            theme === "dark" ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        />
      </div>
      <span className="sr-only">
        {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </Button>
  );
}