import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const COMMENTS_TOO_LONG_MESSAGE = 'Additional information must be 240 characters or less'

export const enterRelationshipCommentsSchema = createSchema({
  comments: z
    .string()
    .max(240, COMMENTS_TOO_LONG_MESSAGE)
    .optional()
    .transform(value => value?.trim() || undefined),
})

export type EnterRelationshipCommentsSchemas = z.infer<typeof enterRelationshipCommentsSchema>
