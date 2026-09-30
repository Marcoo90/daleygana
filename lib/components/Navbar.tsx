"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();

  // No mostramos el navbar público en las páginas de administración
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="topbar">
      <Link href="/" className="logo-link">
        <img src="/logo.png" alt="Dale y Gana Logo" className="site-logo" style={{ height: '80px', width: 'auto' }} />
      </Link>
      <div className="nav-links">
        <Link href="/premios" className="nav-link">🎁 Premios y Chances</Link>
        <Link href="/consulta" className="nav-link">🎫 Mis Participaciones</Link>
        <Link href="/ganadores" className="nav-link">🏆 Ganadores</Link>
        <Link href="https://wa.me/51953496746" target="_blank" className="nav-link">💬 Ayuda</Link>
        <Link href="/registro?type=base" className="nav-link highlight">¡Participar S/ 10!</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
