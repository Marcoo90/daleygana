"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // No mostramos el navbar público en las páginas de administración
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="topbar">
      <Link href="/">
        <img src="/logo.png" alt="Dale y Gana Logo" style={{ height: '100px', width: 'auto' }} />
      </Link>
      <div className="nav-links">
        {pathname === '/' ? (
          <>
            <Link href="/premios" className="nav-link">Premios</Link>
            <Link href="https://wa.me/51953496746" target="_blank" className="nav-link">📞 consultas y dudas</Link>
            <Link href="/ganadores" className="nav-link">🏆 Ganadores</Link>
          </>
        ) : (
          <Link href="/" className="nav-link">← Volver al Sorteo</Link>
        )}
        <Link href="/consulta" className="nav-link highlight">🎫 Ver Mis Tickets</Link>
      </div>

    </nav>
  );
}
