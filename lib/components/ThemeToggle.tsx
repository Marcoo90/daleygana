"use client";
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
      if (current) {
        setTheme(current);
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new Event('themechange'));
  };

  if (!mounted) {
    return (
      <div className="theme-toggle-placeholder" aria-hidden="true" />
    );
  }

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${isLight ? 'is-light' : 'is-dark'}`}
      title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      aria-label={isLight ? "Activar modo oscuro" : "Activar modo claro"}
    >
      <div className="theme-toggle-track">
        <span className="theme-toggle-icon sun-icon" aria-hidden="true">
          ☀️
        </span>
        <span className="theme-toggle-icon moon-icon" aria-hidden="true">
          🌙
        </span>
        <div className="theme-toggle-thumb" />
      </div>
    </button>
  );
}
