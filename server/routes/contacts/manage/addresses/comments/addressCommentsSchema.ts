import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const COMMENTS_TOO_LONG_ERROR_MESSAGE = 'Address comments must be 240 characters or less'

export const addressCommentsSchema = createSchema({
  comments: z
    .string()
    .max(240, COMMENTS_TOO_LONG_ERROR_MESSAGE)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
})

export type AddressCommentsSchemaType = z.infer<typeof addressCommentsSchema>
