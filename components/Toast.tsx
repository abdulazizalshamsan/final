export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#171316',
        border: '1px solid #4a201c',
        color: '#ffdedb',
        padding: '11px 18px',
        borderRadius: 8,
        fontSize: 12.5,
        zIndex: 99,
        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
      }}
    >
      {message}
    </div>
  );
}
