import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'Select the status of the relationship '

export const manageRelationshipStatusSchema = createSchema({
  relationshipStatus: z.enum(['YES', 'NO'], { message: REQUIRED_MESSAGE }),
})

export type ManageRelationshipStatusSchemaType = z.infer<typeof manageRelationshipStatusSchema>
