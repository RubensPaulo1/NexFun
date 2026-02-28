import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexfan.com' },
    update: {
      role: 'ADMIN',
      password: adminPassword,
      isActive: true,
      ageVerified: true,
    },
    create: {
      email: 'admin@nexfan.com',
      name: 'Admin NexFan',
      password: adminPassword,
      role: 'ADMIN',
      ageVerified: true,
      isActive: true,
    },
  })
  console.log('✅ Admin user created/updated:', admin.email, 'Role:', admin.role)

  // Create sample creator
  const creatorPassword = await bcrypt.hash('creator123', 12)
  const creator = await prisma.user.upsert({
    where: { email: 'marina@nexfan.com' },
    update: {},
    create: {
      email: 'marina@nexfan.com',
      name: 'Marina Costa',
      password: creatorPassword,
      role: 'CREATOR',
      bio: 'Ilustradora digital e artista conceitual. Criando mundos fantásticos através da arte.',
      ageVerified: true,
    },
  })
  console.log('✅ Creator user created:', creator.email)

  // Create creator profile
  const creatorProfile = await prisma.creatorProfile.upsert({
    where: { userId: creator.id },
    update: {},
    create: {
      userId: creator.id,
      displayName: 'Marina Costa',
      slug: 'marina-costa',
      socialLinks: JSON.stringify({
        twitter: 'https://twitter.com/marinacosta',
        instagram: 'https://instagram.com/marinacosta',
      }),
      isVerified: true,
    },
  })
  console.log('✅ Creator profile created:', creatorProfile.slug)

  // Create plans
  const plans = [
    {
      name: 'Fã',
      price: 9.90,
      benefits: ['Acesso ao Discord exclusivo', 'Posts antecipados', 'Bastidores do processo criativo'],
    },
    {
      name: 'Apoiador',
      price: 19.90,
      benefits: ['Tudo do plano Fã', 'Downloads de wallpapers em alta resolução', 'Tutoriais exclusivos mensais', 'Nome nos créditos'],
    },
    {
      name: 'Mecenas',
      price: 49.90,
      benefits: ['Tudo do plano Apoiador', 'Comissão de arte personalizada (1 por mês)', 'Acesso a lives privadas', 'Feedback direto em seus projetos'],
    },
  ]

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i]
    await prisma.plan.upsert({
      where: { id: `plan-${i + 1}` },
      update: {},
      create: {
        id: `plan-${i + 1}`,
        creatorId: creatorProfile.id,
        name: plan.name,
        description: `Plano ${plan.name} para assinantes`,
        price: plan.price,
        benefits: JSON.stringify(plan.benefits),
        sortOrder: i,
      },
    })
  }
  console.log('✅ Plans created')

  // Create sample posts
  const posts = [
    {
      title: 'Novo processo criativo: Dragão das Profundezas',
      content: 'Confira como foi o processo de criação da minha mais nova ilustração. Neste post, compartilho todas as etapas desde o sketch inicial até a finalização.',
      isPublic: false,
    },
    {
      title: 'Tutorial: Como pintar nuvens realistas',
      content: 'Neste tutorial vou mostrar técnicas para pintar nuvens incríveis que darão vida às suas ilustrações. Vamos abordar desde nuvens fofas até tempestades dramáticas.',
      isPublic: true,
    },
    {
      title: 'Bastidores: Criando a capa do livro',
      content: 'Veja como foi criar a capa para a editora X. Um projeto desafiador que envolveu muita pesquisa e iterações.',
      isPublic: false,
    },
  ]

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    await prisma.post.create({
      data: {
        creatorId: creatorProfile.id,
        title: post.title,
        content: post.content,
        isPublic: post.isPublic,
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      },
    })
  }
  console.log('✅ Posts created')

  // Create sample subscriber
  const subscriberPassword = await bcrypt.hash('user123', 12)
  const subscriber = await prisma.user.upsert({
    where: { email: 'joao@email.com' },
    update: {},
    create: {
      email: 'joao@email.com',
      name: 'João Silva',
      password: subscriberPassword,
      role: 'USER',
      ageVerified: true,
    },
  })
  console.log('✅ Subscriber user created:', subscriber.email)

  // Create subscription
  await prisma.subscription.upsert({
    where: {
      userId_creatorId: {
        userId: subscriber.id,
        creatorId: creatorProfile.id,
      },
    },
    update: {},
    create: {
      userId: subscriber.id,
      creatorId: creatorProfile.id,
      planId: 'plan-2', // Apoiador plan
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  console.log('✅ Subscription created')

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('📧 Test accounts:')
  console.log('   Admin:    admin@nexfan.com / admin123')
  console.log('   Creator:  marina@nexfan.com / creator123')
  console.log('   User:     joao@email.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
