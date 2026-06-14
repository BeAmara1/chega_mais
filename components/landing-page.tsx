import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="w-full min-h-screen" style={{ background: '#0F0F0F' }}>
      <header className="relative w-full" style={{ height: '85vh' }}>
        <img
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          src="https://images.pexels.com/photos/2735037/pexels-photo-2735037.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Encontro musical íntimo sob luzes de varal em São Paulo."
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <h1 className="text-7xl font-bold text-white mb-4 animate-fade-up">
            Chega+
          </h1>
          <p className="text-xl max-w-xl animate-fade-up delay-1" style={{ color: '#f0f0f0' }}>
            Descubra eventos, reúna a galera e viva momentos inesquecíveis.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 px-8 py-4 rounded-full text-lg font-bold animate-fade-up delay-2 hover:scale-105 transition-transform inline-block"
            style={{ background: '#FF4D6D', color: '#fff' }}
          >
            Comece Já
          </Link>
        </div>
      </header>

      <main className="w-full">
        <section className="py-20 px-6">
          <h2 className="text-center text-4xl font-bold mb-16 text-white">
            Por que usar o Chega+?
          </h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="animate-fade-up delay-1 rounded-2xl overflow-hidden shadow-lg">
              <img className="w-full h-48 object-cover" loading="lazy"
                src="https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Plateia animada em evento noturno" />
              <div className="p-6" style={{ background: '#1a1a2e' }}>
                <h3 className="font-bold text-xl mb-2 text-white">Eventos Perto de Você</h3>
                <p style={{ color: '#b0b0c0' }}>Encontre festas, shows e rolês que combinam com o seu estilo.</p>
              </div>
            </div>
            <div className="animate-fade-up delay-2 rounded-2xl overflow-hidden shadow-lg">
              <img className="w-full h-48 object-cover" loading="lazy"
                src="https://images.pexels.com/photos/3776844/pexels-photo-3776844.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Grupo de jovens rindo juntos ao ar livre" />
              <div className="p-6" style={{ background: '#1a1a2e' }}>
                <h3 className="font-bold text-xl mb-2 text-white">Chame a Galera</h3>
                <p style={{ color: '#b0b0c0' }}>Convide amigos com um toque e monte o grupo perfeito.</p>
              </div>
            </div>
            <div className="animate-fade-up delay-3 rounded-2xl overflow-hidden shadow-lg">
              <img className="w-full h-48 object-cover" loading="lazy"
                src="https://images.pexels.com/photos/12432817/pexels-photo-12432817.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Grupo animado em café vibrante" />
              <div className="p-6" style={{ background: '#1a1a2e' }}>
                <h3 className="font-bold text-xl mb-2 text-white">Planeje Junto</h3>
                <p style={{ color: '#b0b0c0' }}>Chat em grupo, enquetes e tudo pra decidir o rolê sem estresse.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="w-full py-12 text-center" style={{ background: '#0a0a0a' }}>
          <p className="text-sm" style={{ color: '#666' }}>&copy; 2026 Chega+ — Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  )
}
