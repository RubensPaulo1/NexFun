# NexFan

Plataforma SaaS de monetização para criadores de conteúdo com sistema de assinaturas recorrentes, controle de acesso premium e integração com múltiplos gateways de pagamento (Stripe e Mercado Pago via PIX).

---

## Visão Geral

NexFan é uma aplicação fullstack construída com **Next.js (App Router)** e **Prisma ORM**, projetada para simular um ambiente real de produção semelhante a plataformas como Patreon e Apoia.se.

A plataforma permite:

- Criadores venderem conteúdo exclusivo
- Fãs assinarem planos recorrentes
- Controle automático de acesso baseado em assinatura ativa
- Integração com múltiplos gateways de pagamento
- Estrutura preparada para escalar como SaaS multi-tenant

---
## Desenvolvimento Assistido por IA

O projeto foi desenvolvido com apoio da ferramenta Cursor para acelerar implementação e refatorações, mantendo total compreensão e controle arquitetural das decisões técnicas.

---
## Funcionalidades

- Autenticação com NextAuth (JWT)
- Sistema de perfis de criador
- lanos de assinatura personalizados
- Conteúdo exclusivo para assinantes ativos
- Pagamentos via:
  - Stripe (Cartão de crédito)
  - Mercado Pago (PIX com QR Code dinâmico)
- Webhooks para confirmação automática de pagamento
- Dashboard do criador
- Controle de acesso via middleware
- Sistema de Payouts
- Painel administrativo
- Upload e armazenamento de mídia (AWS S3)

---

## Arquitetura

```
Usuário
   ↓
Next.js (App Router)
   ↓
NextAuth (JWT)
   ↓
Middleware (controle de acesso e roles)
   ↓
Prisma ORM
   ↓
Banco de Dados
   ↓
Gateways de Pagamento
   → Stripe
   → Mercado Pago (PIX)
```

A arquitetura foi projetada para separar claramente:

- Plano (Plan)
- Assinatura (Subscription)
- Pagamento (Payment)
- Gateway
- Controle de acesso

Essa separação permite:

- Auditoria
- Suporte a múltiplos gateways
- Escalabilidade futura
- Independência entre cobrança e acesso

---

## Fluxo de Pagamento

1. Usuário seleciona plano
2. Escolhe método de pagamento (Stripe ou PIX)
3. Sistema cria pagamento no gateway
4. Gateway envia webhook
5. Status da assinatura é atualizado no banco
6. Middleware libera conteúdo exclusivo automaticamente

### Garantias de Consistência

- Conteúdo só é liberado após confirmação via webhook
- Pagamentos são registrados independentemente da assinatura
- Status pendente, falho e expirado são tratados separadamente

---

## Controle de Acesso

Implementado via `middleware.ts`:

- Rotas privadas redirecionam usuários não autenticados
- Rotas administrativas protegidas por role
- Verificação de assinatura ativa antes de exibir conteúdo premium
- Proteção centralizada para evitar lógica duplicada nas páginas

---

## Stack Tecnológica

- Next.js (App Router)
- TypeScript
- Prisma ORM
- SQLite (desenvolvimento)
- PostgreSQL (produção)
- Stripe API
- Mercado Pago API (PIX)
- NextAuth
- Tailwind CSS
- AWS S3 (armazenamento de mídia)

---

## Modelo de Dados

Principais entidades:

- User
- Creator
- Plan
- Subscription
- Payment
- Payout
- VerificationRequest


---

## 📸 Screenshots

Crie uma pasta `/docs` e adicione as imagens:

```
docs/
 ├── login.png
 ├── dashboard.png
 ├── planos.png
 ├── pix.png
 └── stripe.png
```

Exemplo de uso:

```md
### Dashboard
![Dashboard](./docs/dashboard.png)
```

---

## Instalação

```bash
git clone https://github.com/seuusuario/nexfan.git
cd nexfan
npm install
npx prisma migrate dev
npm run dev
```

---

## Variáveis de Ambiente

Baseado em `env.example`:

```
DATABASE_URL=
NEXTAUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
```

---

## Webhooks

O sistema depende de webhooks para:

- Confirmar pagamento
- Atualizar status da assinatura
- Garantir consistência transacional

Stripe e Mercado Pago enviam notificações para rotas específicas da aplicação, que atualizam o banco via Prisma.

---

## Decisões Técnicas

- Uso de JWT para simplificar sessão e escalabilidade
- Middleware centralizado para controle de acesso
- Separação entre Payment e Subscription para flexibilidade
- Arquitetura preparada para multi-tenant
- Integração com dois gateways para simular ambiente real de mercado

---

## Melhorias Futuras

- Analytics de criadores
- Sistema de cancelamento automático
- Split automático de pagamentos
- Escalonamento multi-tenant real
- Deploy com Docker
- Sistema antifraude
- Logs estruturados

---

## Licença

Projeto para fins educacionais e de portfólio.

---

## Autor

Rubens Paulo  
