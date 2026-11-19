import { z } from 'zod'

export const secureKeySchema = z.enum(['access-token', 'refresh-token', 'demo-secret'])
export type SecureKey = z.infer<typeof secureKeySchema>

export const secureStorageErrorCodeSchema = z.enum(['ENCRYPTION_UNAVAILABLE', 'STORAGE_FAILURE'])

const secureStorageErrorSchema = z.object({
  code: secureStorageErrorCodeSchema,
  message: z.string(),
})

const secureSuccessSchema = z.object({
  ok: z.literal(true),
})

const secureFailureSchema = z.object({
  ok: z.literal(false),
  error: secureStorageErrorSchema,
})

const secureMutationResultSchema = z.discriminatedUnion('ok', [secureSuccessSchema, secureFailureSchema])
const secureGetResultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    value: z.string().nullable(),
  }),
  secureFailureSchema,
])

export const secureIpcSchema = {
  'secure-get': {
    args: z.tuple([secureKeySchema]),
    return: secureGetResultSchema,
  },
  'secure-set': {
    args: z.tuple([secureKeySchema, z.string()]),
    return: secureMutationResultSchema,
  },
  'secure-delete': {
    args: z.tuple([secureKeySchema]),
    return: secureMutationResultSchema,
  },
}
