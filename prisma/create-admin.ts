import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  console.log('🔐 Criar Usuário Admin\n')

  try {
    const email = await question('Email do admin: ')
    if (!email || !email.includes('@')) {
      console.error('❌ Email inválido!')
      process.exit(1)
    }

    const name = await question('Nome do admin: ')
    if (!name || name.trim().length < 2) {
      console.error('❌ Nome deve ter pelo menos 2 caracteres!')
      process.exit(1)
    }

    const password = await question('Senha: ')
    if (!password || password.length < 6) {
      console.error('❌ Senha deve ter pelo menos 6 caracteres!')
      process.exit(1)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      console.log(`\n⚠️  Usuário com email ${email} já existe.`)
      const update = await question('Deseja atualizar para ADMIN? (s/n): ')
      if (update.toLowerCase() !== 's') {
        console.log('❌ Operação cancelada.')
        process.exit(0)
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
          name: name.trim(),
          isActive: true,
          ageVerified: true,
        },
      })

      console.log('\n✅ Usuário atualizado para ADMIN com sucesso!')
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Nome: ${updatedUser.name}`)
      console.log(`   Role: ${updatedUser.role}`)
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 12)
      const admin = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name.trim(),
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          ageVerified: true,
        },
      })

      console.log('\n✅ Usuário admin criado com sucesso!')
      console.log(`   Email: ${admin.email}`)
      console.log(`   Nome: ${admin.name}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   ID: ${admin.id}`)
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_USER_CREATED',
          entity: 'User',
          metadata: JSON.stringify({ email: email.toLowerCase() }),
        },
      })
    } catch (auditError) {
      console.warn('⚠️  Erro ao criar log de auditoria (pode ser ignorado)')
    }
  } catch (error: any) {
    console.error('\n❌ Erro ao criar usuário admin:', error.message)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()

