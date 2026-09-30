"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PremiosPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/#chances');
  }, [router]);

  return (
    <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <span style={{ fontSize: '3.5rem' }}>🎁</span>
      <h2 className="hero-compact-title" style={{ marginTop: '1rem' }}>
        Cargando Premios y Chances...
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem' }}>
        Redirigiendo a la sección de premios y chances en la página principal.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/#chances" className="btn-cyan-v5" style={{ display: 'inline-block', width: 'auto', padding: '0.8rem 1.8rem' }}>
          Ir a Premios y Chances
        </Link>
      </div>
    </div>
  );
}
