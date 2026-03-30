import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center' as const,
      padding: '2rem', gap: '1rem',
    }}>
      <span style={{ fontSize: '4rem' }}>🎬</span>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', letterSpacing: '2px' }}>
        Página no encontrada
      </h1>
      <p style={{ color: '#b3b3b3', maxWidth: '360px' }}>
        La página que buscás no existe o fue movida.
      </p>
      <Link href="/" style={{
        marginTop: '1rem', padding: '12px 32px', background: '#a855f7',
        borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem',
      }}>
        Volver al inicio
      </Link>
    </div>
  );
}
