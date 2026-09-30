# The Cinematic Chef

App web bilíngue (PT/EN) de comidas típicas do mundo, ligado ao Instagram
[@thecinematic.chef](https://instagram.com/thecinematic.chef). O usuário gira um
globo 3D, desce até um lugar e acessa os pratos típicos dali.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · next-intl ·
Supabase (Postgres, Auth, Storage, RLS) · Mux · Stripe + Mercado Pago · API do Claude.

## Rodando localmente

Requisitos: Node 22+ e Docker (para o Supabase local).

```bash
npm install
npm run db:start          # sobe o Supabase local e imprime as chaves
cp .env.example .env.local
# cole PUBLISHABLE_KEY e SECRET_KEY de `npx supabase status` no .env.local
npm run dev               # http://localhost:3000
```

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos de rota do Next e roda `tsc` |
| `npm run db:start` / `db:stop` | Liga/desliga o Supabase local |
| `npm run db:reset` | Recria o banco aplicando migrations e seed |
| `npm run db:types` | Gera `src/lib/supabase/database.types.ts` a partir do banco local |

## Estrutura

```
messages/            textos da interface (pt.json, en.json)
src/app/[locale]/    páginas públicas em /pt e /en
src/components/ui/   componentes shadcn/ui
src/i18n/            rotas, navegação e carregamento de mensagens (next-intl)
src/lib/supabase/    clientes do navegador, do servidor, do proxy e admin
src/proxy.ts         detecção de idioma + renovação da sessão do Supabase
supabase/            config local, migrations e seed
```

## Idiomas

`/` redireciona para `/pt` ou `/en` conforme o cookie `NEXT_LOCALE` (salvo pelo
seletor de idioma) ou o `Accept-Language` do navegador. Idiomas sem suporte
caem em `/pt`.

## Variáveis de ambiente

Veja `.env.example`. Só as variáveis `NEXT_PUBLIC_*` chegam ao navegador; as
demais são lidas no servidor por `src/lib/env.server.ts`, que importa
`server-only` para impedir o uso em componentes de cliente.
