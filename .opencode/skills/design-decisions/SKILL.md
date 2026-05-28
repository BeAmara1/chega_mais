---
name: design-decisions
description: Use when making UI/UX, styling, or visual design changes to the Chega+/Vibrante social events app. Records brand identity, color palette, layout preferences, and design decisions.
---

# Design Decisions — Vibrante

## Brand Identity
- **Name**: Vibrante (orig: Chega+)
- **Vibe**: Premium nightlife — mistura de festival noturno com elegância-escura
- **Personality**: Sofisticado, mas com personalidade. Nada poluído visualmente, nada formal demais

## Color Palette

### Dark Theme (padrão)
| Token | Color | OKLCH |
|---|---|---|
| `--background` | `#121212` (warm dark) | `oklch(0.11 0.01 20)` |
| `--card` | `#1E1E1E` | `oklch(0.16 0.012 20)` |
| `--primary` | Coral `#FF4D6D` | `oklch(0.65 0.22 18)` |
| `--secondary` | Laranja `#FF8C42` | `oklch(0.72 0.20 45)` |
| `--accent` | Violeta `#8B5CF6` | `oklch(0.58 0.18 290)` |
| `--muted` | `#2A2A2A` (warm) | `oklch(0.22 0.015 20)` |

### Light Theme
- `--background`: `#FFF5F5` (off-white com tom quente)
- `--primary`: Coral slightly darker `oklch(0.62 0.22 18)`
- `--secondary`: Laranja `oklch(0.7 0.2 45)`

## Layout
- **Desktop (≥768px)**: Top navigation bar (não sidebar) + conteúdo em grid 2 colunas
- **Mobile (≤767px)**: Bottom navigation + single column
- **Max widths**: `max-w-lg` no mobile, `max-w-6xl` no desktop

## Effects & Visual Style
- Glows sutis (não neon) em botões primários: `hover:shadow-[0_0_24px_-4px_var(--primary)]`
- Glassmorphism apenas em overlays (auth cards, badges sobre imagens)
- Header com borda gradiente sutil `from-primary/10 via-secondary/10 to-transparent`
- Cards com hover: `translateY(-2px)` + `shadow-xl` + `ring-primary/20`
- Transições consistentes: `transition-all duration-300`
- Gradiente radial no fundo das páginas de auth
- Botão "Quero ir" com glow hover

## Design Decisions Log
- 2026-05-27: Layout desktop = top nav + grid (rejeitado sidebar)
- 2026-05-27: Complete redesign (rejeitado "leve" ou "medio")
- 2026-05-27: Estilo = meio termo entre festival noturno e elegante-escuro
- 2026-05-27: Paleta coral/laranja/violeta escolhida
- 2026-05-27: Event filters = search-only (sem categorias, sem sort sheet)
