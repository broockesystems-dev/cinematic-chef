import { site } from "@/lib/site";

// Plain-language legal texts. Review with a lawyer before launch; business
// details come from src/lib/site.ts.

export type LegalSection = { title: string; body: string[] };
export type LegalDocument = { updated: string; sections: LegalSection[] };

const UPDATED = "2026-09-30";
const email = site.contactEmail;

export const privacy: Record<"pt" | "en", LegalDocument> = {
  pt: {
    updated: UPDATED,
    sections: [
      {
        title: "Quem somos",
        body: [
          `${site.name} é um serviço de ${site.legalName}, controladora dos dados pessoais tratados no app. Fale com a gente em ${email}.`,
        ],
      },
      {
        title: "Dados que coletamos",
        body: [
          "Conta: e-mail, nome (se você informar ou vier do Google), idioma e país.",
          "Uso: pratos favoritados e o status da sua assinatura (plano, provedor, validade).",
          "Chef IA (assinantes): as perguntas que você faz e as respostas, guardadas por prato até você limpar a conversa ou excluir a conta.",
          "Passaporte: os pratos que você marcou como feitos e as fotos que enviar, visíveis só para você, a menos que você torne o passaporte público.",
          "Pagamento: processado pelo Stripe (cartão) ou Mercado Pago (Pix). Não recebemos nem guardamos dados de cartão.",
          "Técnicos: registros de acesso mantidos pelos nossos provedores de hospedagem por segurança.",
        ],
      },
      {
        title: "Para que usamos",
        body: [
          "Criar e manter sua conta e liberar o conteúdo do seu plano (execução de contrato, LGPD art. 7º, V).",
          "Cobrar a assinatura e cumprir obrigações fiscais (execução de contrato e obrigação legal, art. 7º, II e V).",
          "Proteger o serviço contra abuso, com limites de uso e registros (legítimo interesse, art. 7º, IX).",
        ],
      },
      {
        title: "Com quem compartilhamos",
        body: [
          "Somente com operadores necessários ao serviço: Supabase (banco de dados e login), Vercel (hospedagem), Mux (vídeos), Stripe e Mercado Pago (pagamentos), Anthropic (gera as respostas do Chef IA a partir das suas perguntas e da receita; não usa esses dados para treinar modelos) e Google (se você entrar com Google). Alguns ficam fora do Brasil; a transferência segue o art. 33 da LGPD, com cláusulas contratuais adequadas.",
          "Não vendemos seus dados e não usamos cookies de publicidade.",
        ],
      },
      {
        title: "Cookies",
        body: [
          "Usamos apenas cookies essenciais: a sessão de login e a preferência de idioma. O player de vídeo roda sem cookies de analytics. A escolha entre medidas métricas e americanas fica salva só no seu navegador.",
        ],
      },
      {
        title: "Por quanto tempo guardamos",
        body: [
          "Enquanto sua conta existir. Ao excluir a conta, apagamos perfil, favoritos e histórico de assinatura. Os provedores de pagamento mantêm os registros de cobrança pelo prazo exigido pela legislação fiscal.",
        ],
      },
      {
        title: "Seus direitos",
        body: [
          "Você pode confirmar a existência de tratamento, acessar, corrigir, portar e excluir seus dados, além de revogar consentimentos (LGPD art. 18).",
          `Nome, idioma e país podem ser alterados em Minha conta, onde também dá para excluir a conta a qualquer momento. Para os demais pedidos, escreva para ${email}; respondemos em até 15 dias.`,
          "Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
        ],
      },
      {
        title: "Mudanças",
        body: [
          "Se esta política mudar de forma relevante, avisaremos no app ou por e-mail antes de a mudança valer.",
        ],
      },
    ],
  },
  en: {
    updated: UPDATED,
    sections: [
      {
        title: "Who we are",
        body: [
          `${site.name} is a service by ${site.legalName}, the controller of the personal data processed in the app. Contact us at ${email}.`,
        ],
      },
      {
        title: "Data we collect",
        body: [
          "Account: email, name (if you provide it or it comes from Google), language and country.",
          "Usage: favorite dishes and your subscription status (plan, provider, expiry).",
          "AI Chef (subscribers): the questions you ask and the answers, stored per dish until you clear the conversation or delete your account.",
          "Passport: the dishes you mark as cooked and any photos you upload, visible only to you unless you make your passport public.",
          "Payments: processed by Stripe (card) or Mercado Pago (Pix). We never receive or store card details.",
          "Technical: access logs kept by our hosting providers for security.",
        ],
      },
      {
        title: "How we use it",
        body: [
          "To create and maintain your account and unlock your plan's content (performance of a contract).",
          "To bill your subscription and meet tax obligations (contract and legal obligation).",
          "To protect the service from abuse with rate limits and logs (legitimate interest).",
        ],
      },
      {
        title: "Who we share it with",
        body: [
          "Only processors the service needs: Supabase (database and sign-in), Vercel (hosting), Mux (video), Stripe and Mercado Pago (payments), Anthropic (generates AI Chef answers from your questions and the recipe; it does not use this data to train models) and Google (if you sign in with Google). Some are located outside Brazil; transfers rely on appropriate contractual safeguards.",
          "We don't sell your data or use advertising cookies.",
        ],
      },
      {
        title: "Cookies",
        body: [
          "We only use essential cookies: your sign-in session and language preference. The video player runs without analytics cookies. Your metric/US units choice is stored only in your browser.",
        ],
      },
      {
        title: "How long we keep it",
        body: [
          "For as long as your account exists. When you delete your account we erase your profile, favorites and subscription history. Payment providers keep billing records for the period required by tax law.",
        ],
      },
      {
        title: "Your rights",
        body: [
          "You can confirm processing, access, correct, port and delete your data, and withdraw consent (Brazil's LGPD, art. 18; similar rights apply under GDPR where relevant).",
          `You can change your name, language and country in My account, and delete your account there at any time. For other requests, email ${email}; we reply within 15 days.`,
          "You may also complain to Brazil's data protection authority (ANPD) or your local authority.",
        ],
      },
      {
        title: "Changes",
        body: [
          "If this policy changes materially, we'll tell you in the app or by email before the change takes effect.",
        ],
      },
    ],
  },
};

export const terms: Record<"pt" | "en", LegalDocument> = {
  pt: {
    updated: UPDATED,
    sections: [
      {
        title: "O serviço",
        body: [
          `${site.name} reúne pratos típicos do mundo com história, receita e vídeo. Parte do conteúdo é gratuita; o restante exige assinatura.`,
        ],
      },
      {
        title: "Conta",
        body: [
          "Você entra com um link enviado ao seu e-mail ou com o Google e é responsável pelo acesso à sua conta. A conta é pessoal.",
        ],
      },
      {
        title: "Assinatura e pagamento",
        body: [
          "Cartão (Stripe, em dólares): a assinatura renova automaticamente no fim de cada período até você cancelar em Minha conta › Gerenciar pagamento. O acesso continua até o fim do período já pago.",
          "Pix (Mercado Pago, em reais): cada pagamento libera o período escolhido (mensal ou anual) e não há cobrança automática. Pagamentos seguidos somam tempo.",
          "Os preços podem mudar; avisaremos antes e a mudança vale a partir do período seguinte.",
        ],
      },
      {
        title: "Arrependimento e reembolso",
        body: [
          `Você pode desistir em até 7 dias da contratação e receber o valor de volta (Código de Defesa do Consumidor, art. 49). Escreva para ${email}.`,
        ],
      },
      {
        title: "Uso do conteúdo",
        body: [
          "Receitas, textos, fotos e vídeos são protegidos por direitos autorais e licenciados só para uso pessoal e não comercial. Não é permitido copiar, redistribuir ou burlar as proteções de acesso.",
        ],
      },
      {
        title: "Segurança na cozinha",
        body: [
          "As receitas são orientações. Confira alergias e restrições, manuseie óleo quente, facas e fogo com cuidado e siga boas práticas de higiene. Não nos responsabilizamos por danos decorrentes do preparo.",
        ],
      },
      {
        title: "Encerramento",
        body: [
          "Você pode excluir sua conta quando quiser. Podemos suspender contas que violem estes termos, avisando o motivo.",
        ],
      },
      {
        title: "Lei aplicável",
        body: [
          "Estes termos seguem a lei brasileira. Fica eleito o foro do domicílio do consumidor.",
        ],
      },
    ],
  },
  en: {
    updated: UPDATED,
    sections: [
      {
        title: "The service",
        body: [
          `${site.name} brings together traditional dishes from around the world with their story, recipe and video. Some content is free; the rest requires a subscription.`,
        ],
      },
      {
        title: "Your account",
        body: [
          "You sign in with a link sent to your email or with Google, and you're responsible for access to your account. Accounts are personal.",
        ],
      },
      {
        title: "Subscription and payment",
        body: [
          "Card (Stripe, in US dollars): your subscription renews automatically at the end of each period until you cancel in My account › Manage billing. Access continues until the end of the period you've paid for.",
          "Pix (Mercado Pago, in Brazilian reais): each payment unlocks the chosen period (monthly or annual) with no automatic charges. Consecutive payments add up.",
          "Prices may change; we'll let you know in advance and the change applies from the next period.",
        ],
      },
      {
        title: "Cancellation and refunds",
        body: [
          `You can cancel within 7 days of purchase for a full refund (Brazilian Consumer Code, art. 49; other statutory rights in your country also apply). Email ${email}.`,
        ],
      },
      {
        title: "Using the content",
        body: [
          "Recipes, texts, photos and videos are protected by copyright and licensed for personal, non-commercial use only. Copying, redistributing or circumventing access protections is not allowed.",
        ],
      },
      {
        title: "Kitchen safety",
        body: [
          "Recipes are guidance. Check for allergies and dietary restrictions, handle hot oil, knives and open flames with care, and follow good hygiene practices. We are not liable for harm arising from preparing the dishes.",
        ],
      },
      {
        title: "Ending the service",
        body: [
          "You can delete your account at any time. We may suspend accounts that break these terms, and will tell you why.",
        ],
      },
      {
        title: "Governing law",
        body: [
          "These terms are governed by Brazilian law, without prejudice to mandatory consumer protections where you live.",
        ],
      },
    ],
  },
};
