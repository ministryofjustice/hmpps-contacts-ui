import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_RELATIONSHIP_TYPE_MESSAGE = 'Select if this is a social or official contact for the prisoner'

export const selectRelationshipTypeSchema = () => async () => {
  return createSchema({
    relationshipType: z.enum(['S', 'O'], { message: SELECT_RELATIONSHIP_TYPE_MESSAGE }),
  })
}

export type RelationshipTypeSchema = z.infer<Awaited<ReturnType<ReturnType<typeof selectRelationshipTypeSchema>>>>
