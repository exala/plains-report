export default function EarlTake({ text }) {
  return (
    <div style={{ borderLeft: '3px solid #E87722', background: 'rgba(232,119,34,0.06)', borderRadius: '0 6px 6px 0', padding: '13px 15px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#E87722', marginBottom: 8 }}>
        ★ EASY EARL SAYS
      </div>
      <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13, lineHeight: 1.75, color: '#C8B99A', margin: 0 }}>
        {text}
      </p>
    </div>
  );
}
