
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: typeof window !== 'undefined' 
        ? window?.document?.documentElement?.classList?.contains('dark') 
          ? 'dark' 
          : 'light'
        : 'light',
      setTheme: (theme) => {
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
          set({ theme });
        }
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(newTheme);
          }
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
  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
};
