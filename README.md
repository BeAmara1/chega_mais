<p align="center">
  <img src="/icon.svg" alt="Chega+" width="80" />
</p>

<h1 align="center">Chega+</h1>

<p align="center">
  <strong>Rede social de eventos</strong><br />
  Descubra eventos, reúna a galera e viva momentos inesquecíveis.
</p>

<p align="center">
  <a href="https://chegamais-rede.vercel.app" target="_blank">🌐 Acessar o site</a>
</p>

---

## Funcionalidades

- **Feed** — descubra eventos perto de você
- **Match** — Tinder-style para conectar pessoas premium (like mútuo libera chat)
- **Chat em grupo** — converse com amigos e organize rolês com mensagens em tempo real (Ably)
- **Criação de eventos** — crie e compartilhe eventos com a galera
- **Amigos** — adicione amigos e veja o que eles estão fazendo
- **Temas claro/escuro** — alternância livre entre light e dark mode
- **Música ambiente** — trilha sonora na landing page com controle de volume
- **Autenticação** — login por email e Google

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Linguagem | [TypeScript](https://www.typescriptlang.org) |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com) + CSS Variables |
| Banco & Auth | [Supabase](https://supabase.com) (PostgreSQL + RLS) |
| Tempo real | [Ably](https://ably.com) (chat instantâneo) |
| Hospedagem | [Vercel](https://vercel.com) |

---

## Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/BeAmara1/chega_mais.git
cd chega_mais

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# NEXT_PUBLIC_ABLY_API_KEY e demais variáveis

# 4. Rode o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

---

## Estrutura do projeto

```
app/                  → Páginas (App Router)
  feed/               → Página inicial
  match/              → Tela de match (Tinder-like)
  chat/               → Mensagens e grupos
  profile/            → Perfil do usuário
  event/[id]/         → Página de cada evento
  auth/               → Login, cadastro, recuperação

components/           → Componentes reutilizáveis
  match-card.tsx      → Card de swipe do match
  bottom-nav.tsx      → Navegação inferior mobile
  theme-toggle.tsx    → Alternador claro/escuro
  background-music.tsx → Música ambiente da landing

lib/                  → Lógica de negócio
  supabase/           → Conexão e cliente Supabase
  match.ts            → Lógica do match (likes, matches)
  chat.ts             → Lógica do chat (grupos, mensagens)
  types.ts            → Tipos TypeScript

sql/                  → Scripts SQL (RLS, triggers, migrações)
```

---

## Deploy

O deploy é automático via Vercel. Toda vez que a branch `main` recebe um push, a Vercel constrói e publica uma nova versão.

---

## Licença

Projeto acadêmico — FGV / Ciência de Dados.
