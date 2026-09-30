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
| `npm test` | Testes unitários (Vitest): medidas, frações, formatos |
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

- **Link mágico** por e-mail e **Google** (`/[locale]/login`). O formulário
  informa que continuar significa aceitar os Termos e a Política de
  Privacidade; a data fica em `profiles.terms_accepted_at`.
- **Google:** crie um OAuth Client no Google Cloud com o redirect
  `https://<projeto>.supabase.co/auth/v1/callback` e ative o provedor no painel
  do Supabase (Authentication › Providers). Localmente, preencha
  `SUPABASE_AUTH_GOOGLE_CLIENT_ID`/`SECRET` em `supabase/.env` e mude
  `enabled = true` em `[auth.external.google]` no `supabase/config.toml`.


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

## Explorar: globo, navegação e busca

- **Home (`/pt`, `/en`) e `/explore/continente/país/cidade/bairro`:** globo 3D
  (react-globe.gl) ao lado de um painel com a trilha, a contagem de pratos e
  quantos são grátis em cada nível. No celular o painel vira uma gaveta
  inferior, com a busca sempre visível.
- **Pinos** só onde há prato publicado (um por cidade; bairros entram na
  cidade). Clicar num pino anima a câmera até o lugar; o globo fica no layout
  e não recarrega ao navegar.
- **Celular:** textura menor (160 KB contra 640 KB), sem relevo, resolução
  limitada e no máximo 40 pinos. Rotação automática só na visão geral e
  desligada para quem pede movimento reduzido. Sem WebGL, a lista continua
  funcionando.
- **Acessibilidade:** o painel é HTML renderizado no servidor, navegável por
  teclado e indexável; os pinos são um atalho para mouse e toque.
- **Busca:** `/api/search?q=&locale=` usa o full-text do Postgres
  (`search_catalog`), sem acento, por prefixo e nos dois idiomas, cobrindo
  nome e história dos pratos e nomes de lugares. Tem rate limit por IP e cache
  de 1 minuto na CDN.
- As páginas do explorador são estáticas (revalidadas a cada 5 minutos e na
  hora quando o admin salva algo).

## Página do prato (`/pt/dish/[slug]`)

- Capa, trilha do lugar, selo grátis/assinantes, tempo, dificuldade e porções.
- **Acesso decidido no servidor:** a página lê ingredientes, passos e o vídeo
  completo com a sessão do visitante; o RLS só devolve esses dados quando
  `has_access` permite. Quem não assina vê história, teaser e um convite para
  assinar, e nada da receita chega ao navegador.
- **Porções e medidas:** ajustar porções recalcula tudo; o botão
  Métrico/Americano começa pelo idioma (PT → métrico, EN → americano) e a
  escolha fica salva no navegador. Medidas americanas saem em frações (½ cup,
  8 ¾ oz).
- **Vídeo:** Mux Player carregado só quando aparece na tela e sem cookies de
  analytics. O vídeo completo usa tokens assinados de 1 hora gerados no
  servidor (`src/lib/video.ts`); se expirarem, o player pede novos em
  `/api/video-token`, que também respeita o RLS. Gere a chave em Mux ›
  Settings › Signing Keys e preencha `MUX_SIGNING_KEY` e `MUX_PRIVATE_KEY`
  (a chave privada em base64, como o Mux entrega).
- **Modo cozinha:** tela cheia, um passo por vez, texto grande, setas do
  teclado ou deslizar, ingredientes numa gaveta, tela sempre acesa (Wake Lock)
  e timers que continuam rodando entre passos, com som e vibração ao terminar.

## Planos e pagamentos

| | Brasil (perfil com país BR) | Resto do mundo |
| --- | --- | --- |
| Moeda | BRL | USD |
| Provedor | Mercado Pago, Pix | Stripe, cartão |
| Cobrança | À vista: cada pagamento libera 1 mês ou 1 ano; pagamentos seguidos somam tempo | Assinatura recorrente, cancelável no portal do Stripe |
| Preço (em `src/lib/plans.ts`) | R$ 19,90/mês · R$ 199/ano | US$ 5,99/mês · US$ 59/ano |

- O PDF deixava em aberto o Pix recorrente; ficou o Pix à vista por período,
  como o próprio PDF sugere como alternativa. Dá para trocar por Pix
  Automático no futuro sem mexer no controle de acesso.
- **O acesso só é liberado pela tabela `subscriptions`**, que só os webhooks
  escrevem (com a chave secreta), sempre depois de verificar a assinatura
  do provedor. Voltar do checkout não libera nada.
- **Stripe:** crie os Prices (USD) mensal e anual e coloque os IDs em
  `STRIPE_PRICE_MONTHLY`/`STRIPE_PRICE_ANNUAL`. Em Developers › Webhooks,
  aponte para `/api/webhooks/stripe` com os eventos
  `checkout.session.completed` e `customer.subscription.created/updated/deleted`
  e copie o segredo para `STRIPE_WEBHOOK_SECRET`. Ative o Customer Portal
  (Settings › Billing › Customer portal).
- **Mercado Pago:** use o Access Token de produção em
  `MERCADOPAGO_ACCESS_TOKEN`. Em Suas integrações › Webhooks, aponte para
  `/api/webhooks/mercadopago`, marque o evento *Pagamentos* e copie a
  assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`. O webhook confere a
  assinatura, busca o pagamento na API, exige status `approved` e o valor do
  plano, e é seguro contra reenvios.
- `STRIPE_API_HOST/PORT` e `MERCADOPAGO_API_URL` existem só para testes locais
  contra um servidor simulado; não defina em produção.

## Área do usuário e LGPD

- `/[locale]/account`: plano e validade, portal de pagamento (cartão) ou
  "adicionar mais tempo" (Pix), favoritos, nome, idioma e país.
- **Excluir conta:** cancela a assinatura no Stripe antes (se não conseguir,
  não apaga, para ninguém ficar sendo cobrado sem conta) e depois apaga o
  usuário; perfil, favoritos e assinaturas vão junto (cascade).
- `/privacy` e `/terms` nos dois idiomas, com textos em
  `src/content/legal.ts` e dados da empresa em `src/lib/site.ts`. **Revise os
  textos com um advogado antes de lançar.**
- Cookies: só os essenciais (sessão e idioma); o player do Mux roda sem
  cookies de analytics.

## Idiomas

`/` redireciona para `/pt` ou `/en` conforme o cookie `NEXT_LOCALE` (salvo pelo
seletor de idioma) ou o `Accept-Language` do navegador. Idiomas sem suporte
caem em `/pt`.

## Variáveis de ambiente

Veja `.env.example`. Só as variáveis `NEXT_PUBLIC_*` chegam ao navegador; as
demais são lidas no servidor por `src/lib/env.server.ts`, que importa
`server-only` para impedir o uso em componentes de cliente.
