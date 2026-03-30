export default function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '1rem', flexDirection: 'column' as const,
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid #222', borderTopColor: '#a855f7',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
