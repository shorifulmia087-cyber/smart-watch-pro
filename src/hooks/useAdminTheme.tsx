import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface AdminThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const AdminThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('admin-theme');
    return (stored === 'dark' ? 'dark' : 'light') as Theme;
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => useContext(AdminThemeContext);
