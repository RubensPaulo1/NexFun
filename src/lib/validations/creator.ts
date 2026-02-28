import { z } from 'zod'

export const createCreatorProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Nome de exibição é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  slug: z
    .string()
    .min(1, 'URL personalizada é obrigatória')
    .min(3, 'URL deve ter pelo menos 3 caracteres')
    .max(30, 'URL deve ter no máximo 30 caracteres')
    .regex(/^[a-z0-9-]+$/, 'URL pode conter apenas letras minúsculas, números e hífens'),
  bio: z
    .string()
    .max(500, 'Bio deve ter no máximo 500 caracteres')
    .optional(),
  socialLinks: z
    .object({
      twitter: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
      instagram: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
      youtube: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
      website: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
    })
    .optional(),
})

export const updateCreatorProfileSchema = createCreatorProfileSchema.partial()

export const createPlanSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do plano é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  price: z
    .number()
    .min(5, 'Preço mínimo é R$ 5,00')
    .max(10000, 'Preço máximo é R$ 10.000,00'),
  currency: z.enum(['BRL', 'USD']).default('BRL'),
  interval: z.literal('MONTHLY').default('MONTHLY'),
  benefits: z
    .array(z.string().min(1, 'Benefício não pode estar vazio'))
    .min(1, 'Adicione pelo menos um benefício')
    .max(10, 'Máximo de 10 benefícios'),
})

export const updatePlanSchema = createPlanSchema.partial()

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  content: z
    .string()
    .max(10000, 'Conteúdo deve ter no máximo 10.000 caracteres')
    .optional(),
  isPublic: z.boolean().default(false),
  planIds: z.array(z.string()).optional(), // Which plans can access this post
})

export const updatePostSchema = createPostSchema.partial()

export type CreateCreatorProfileInput = z.infer<typeof createCreatorProfileSchema>
export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>
export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

