export default function HomePage() {
  return (
    <div style={{ background: '#0F0F0F', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontSize: 72, fontWeight: 900, margin: 0, color: '#FF4D6D' }}>Chega+</h1>
      <p style={{ fontSize: 20, maxWidth: 576 }}>LANDING_PAGE_ACTIVE</p>
      <a href="/auth/login" style={{ marginTop: 32, padding: '16px 32px', borderRadius: 9999, fontSize: 18, fontWeight: 700, background: '#FF4D6D', color: '#fff', textDecoration: 'none', display: 'inline-block' }}>Comece Já</a>
    </div>
  )
}
