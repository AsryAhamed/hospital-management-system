export default function Loader({ label = "Loading..." }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)',
      background: '#0b1220'
    }}>
      <span className="spin" aria-hidden="true" />
      <span style={{ opacity: .9 }}>{label}</span>
    </div>
  )
}
