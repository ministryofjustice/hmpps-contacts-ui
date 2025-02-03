import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const RELATIONSHIP_REQUIRED_MESSAGE = 'Enter the contact’s relationship to the prisoner'

export const selectRelationshipSchemaFactory = () => async () => {
  return createSchema({
    relationship: z.string().trim().min(1, { message: RELATIONSHIP_REQUIRED_MESSAGE }),
  })
}

export type SelectRelationshipSchema = z.infer<Awaited<ReturnType<ReturnType<typeof selectRelationshipSchemaFactory>>>>
