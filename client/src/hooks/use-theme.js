
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        set({ theme });
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(newTheme);
          return { theme: newTheme };
        });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useThemeStore();
  
  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  };
};

export function ThemeProvider({ children }) {
  const { theme } = useTheme();
  return children;
}
