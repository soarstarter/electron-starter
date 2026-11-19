import { z } from 'zod'

const fileOpenResultSchema = z.object({
  canceled: z.boolean(),
  path: z.string().nullable(),
  content: z.string().nullable(),
})

const fileSavePayloadSchema = z.object({
  content: z.string(),
  saveAs: z.boolean(),
})

const fileSaveResultSchema = z.object({
  canceled: z.boolean(),
  path: z.string().nullable(),
})

export const imageMimeTypeSchema = z.enum(['image/png', 'image/jpeg', 'image/webp'])
export type ImageMimeType = z.infer<typeof imageMimeTypeSchema>

const fileOpenImagePayloadSchema = z.object({
  accept: z.array(imageMimeTypeSchema).min(1),
  maxBytes: z.number().int().positive(),
})

const fileOpenImageResultSchema = z.discriminatedUnion('canceled', [
  z.object({ canceled: z.literal(true) }),
  z.object({
    canceled: z.literal(false),
    path: z.string(),
    name: z.string(),
    bytes: z.instanceof(Uint8Array),
    mimeType: imageMimeTypeSchema,
  }),
])

export type FileOpenImageResult = z.infer<typeof fileOpenImageResultSchema>

export const fileIpcSchema = {
  'file-open': {
    args: z.tuple([]),
    return: fileOpenResultSchema,
  },
  'file-open-last': {
    args: z.tuple([]),
    return: fileOpenResultSchema,
  },
  'file-open-path': {
    args: z.tuple([z.string().min(1)]),
    return: fileOpenResultSchema,
  },
  'file-save': {
    args: z.tuple([fileSavePayloadSchema]),
    return: fileSaveResultSchema,
  },
  'file-open-image': {
    args: z.tuple([fileOpenImagePayloadSchema]),
    return: fileOpenImageResultSchema,
  },
}
