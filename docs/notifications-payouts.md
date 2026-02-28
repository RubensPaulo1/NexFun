# Notificações de Saques (Payouts)

Este documento descreve como adicionar notificações quando o sistema de saques for implementado.

## Tipos de Notificação de Saques

1. **PAYOUT_COMPLETED** - Quando um saque é concluído com sucesso
2. **PAYOUT_FAILED** - Quando um saque falha

## Onde Adicionar Notificações

Quando implementar o sistema de saques, adicione notificações nos seguintes pontos:

### 1. Quando um saque é processado com sucesso

Adicione a notificação quando o status do payout mudar para `COMPLETED`:

```typescript
// Exemplo (quando implementar a API de saques)
await prisma.payout.update({
  where: { id: payoutId },
  data: { status: 'COMPLETED', processedAt: new Date() },
})

// Criar notificação para o criador
const creator = await prisma.creatorProfile.findUnique({
  where: { id: payout.creatorId },
  include: { user: true },
})

await prisma.notification.create({
  data: {
    userId: creator.userId,
    type: 'PAYOUT_COMPLETED',
    title: 'Saque processado',
    message: `Seu saque de R$ ${payout.amount.toFixed(2)} foi processado com sucesso.`,
    data: JSON.stringify({ payoutId: payout.id }),
  },
})
```

### 2. Quando um saque falha

Adicione a notificação quando o status do payout mudar para `FAILED`:

```typescript
await prisma.payout.update({
  where: { id: payoutId },
  data: { status: 'FAILED' },
})

const creator = await prisma.creatorProfile.findUnique({
  where: { id: payout.creatorId },
  include: { user: true },
})

await prisma.notification.create({
  data: {
    userId: creator.userId,
    type: 'PAYOUT_FAILED',
    title: 'Saque falhou',
    message: `Não foi possível processar seu saque de R$ ${payout.amount.toFixed(2)}. Entre em contato com o suporte.`,
    data: JSON.stringify({ payoutId: payout.id, reason: failureReason }),
  },
})
```

### 3. Webhook do Stripe para Saques

Se usar Stripe Connect para saques, adicione notificações no webhook handler (`src/app/api/webhooks/stripe/route.ts`):

```typescript
case 'payout.paid':
  // Processar saque pago
  // Criar notificação PAYOUT_COMPLETED
  break

case 'payout.failed':
  // Processar saque falhado
  // Criar notificação PAYOUT_FAILED
  break
```

## Ícones de Notificação

Os ícones para notificações de saques já estão configurados:
- `PAYOUT_COMPLETED`: CheckCircle2
- `PAYOUT_FAILED`: XCircle

Eles estão disponíveis em:
- `src/components/notifications/notification-dropdown.tsx`
- `src/app/(dashboard)/dashboard/notifications/page.tsx`

