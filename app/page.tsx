export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Chega+ Landing Page</title>
      </head>
      <body style={{ margin: 0, background: '#0F0F0F', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 72, fontWeight: 900, margin: 0, color: '#FF4D6D' }}>Chega+</h1>
          <p style={{ fontSize: 20, color: '#f0f0f0', maxWidth: 576 }}>LANDING_PAGE_ACTIVE</p>
          <a href="/auth/login" style={{ display: 'inline-block', marginTop: 32, padding: '16px 32px', borderRadius: 9999, fontSize: 18, fontWeight: 700, background: '#FF4D6D', color: '#fff', textDecoration: 'none' }}>Comece Já</a>
        </div>
      </body>
    </html>
  )
}
