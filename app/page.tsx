export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="w-full min-h-screen" style={{ background: '#0F0F0F', color: '#fff', fontFamily: 'sans-serif' }}>
      <div
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2735037/pexels-photo-2735037.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h1 className="text-7xl font-black mb-4" style={{ color: '#FF4D6D' }}>Chega+</h1>
        <p className="text-xl max-w-xl" style={{ color: '#f0f0f0' }}>
          LANDING_PAGE_ACTIVE
        </p>
        <a
          href="/auth/login"
          className="mt-8 px-8 py-4 rounded-full text-lg font-bold inline-block hover:scale-105 transition-transform"
          style={{ background: '#FF4D6D', color: '#fff', textDecoration: 'none' }}
        >
          Comece Já
        </a>
      </div>
    </div>
  )
}
