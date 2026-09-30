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
| `npm run db:test` | Roda os testes de RLS e integridade (pgTAP) |
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

## Banco de dados

Migrations em `supabase/migrations`, seed em `supabase/seed.sql` e testes em
`supabase/tests/database`.

- Textos bilíngues ficam em JSONB `{"pt": "...", "en": "..."}`. O PT é
  obrigatório; o EN pode ficar vazio até ser traduzido.
- `locations` é uma árvore única (continente > país > cidade > bairro); um
  trigger impede, por exemplo, uma cidade pendurada direto num continente.
- Um prato `published` com `published_at` no futuro fica agendado e invisível
  até a data.
- **Acesso:** a função `has_access(dish_id)` decide quem lê ingredientes,
  passos e o vídeo completo: admin, ou prato publicado e (grátis ou assinatura
  `active`/`trialing` com `current_period_end` no futuro). As políticas de RLS
  usam essa função.
- `subscriptions` não aceita escrita de usuários; só os webhooks, com a chave
  secreta, gravam nela. Usuários também não conseguem alterar o próprio `role`.
- Bucket público `media` (capas, fotos de passos, legendas .vtt); só admin envia.

### Tornar alguém admin

Depois que a pessoa fizer login uma vez (o perfil é criado automaticamente):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'voce@exemplo.com');
```

Localmente, rode no SQL do banco (`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`).

## Login

Link mágico por e-mail (Supabase Auth). Localmente os e-mails não saem de
verdade: abra o Mailpit em http://127.0.0.1:54324 para clicar no link. O
callback fica em `/auth/callback` e só aceita redirecionar para caminhos do
próprio site.

## Painel admin (`/admin`)

Só para `role = 'admin'`; qualquer outro usuário recebe 404. O papel é checado
no layout, de novo em cada server action e rota de API, e o RLS do banco
garante o resto.

- **Lugares:** árvore continente › país › cidade › bairro. "Adicionar cidade"
  num país já abre o formulário com o pai escolhido.
- **Pratos:** dados, capa, acesso (grátis/assinantes), status e data de
  publicação (horário de Brasília; data futura agenda). Abas de ingredientes
  (métrico e americano, aceita vírgula decimal), passos (timer e foto) e
  vídeos.
- **Traduzir com IA:** cada campo tem um botão "Traduzir" (PT → EN) e cada
  formulário tem "Traduzir campos vazios", que só preenche o que está vazio
  para não sobrescrever uma tradução revisada. Usa a API do Claude no servidor
  (`src/lib/ai.ts`), limitada a 30 pedidos por minuto por admin.
- **Vídeos:** o navegador envia o arquivo direto ao Mux (upload direto, sem
  passar pelo servidor). O teaser é público; o vídeo completo é criado com
  política `signed`. O Mux avisa em `/api/webhooks/mux` quando o vídeo fica
  pronto; configure esse endereço no painel do Mux (Settings › Webhooks) e
  copie o segredo para `MUX_WEBHOOK_SECRET`.
- **Legendas:** arquivos `.vtt` vão para o bucket `media` e são enviados ao Mux
  como faixas de legenda quando o vídeo está pronto (o Mux precisa baixar o
  arquivo, então isso só acontece com o Supabase na nuvem, não em localhost).

## Idiomas

`/` redireciona para `/pt` ou `/en` conforme o cookie `NEXT_LOCALE` (salvo pelo
seletor de idioma) ou o `Accept-Language` do navegador. Idiomas sem suporte
caem em `/pt`.

## Variáveis de ambiente

Veja `.env.example`. Só as variáveis `NEXT_PUBLIC_*` chegam ao navegador; as
demais são lidas no servidor por `src/lib/env.server.ts`, que importa
`server-only` para impedir o uso em componentes de cliente.
