import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fortexa-theme') as 'dark' | 'light' | null;
    if (stored) setTheme(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('fortexa-theme', theme);
  }, [theme, ready]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
