import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const ACTION_REQUIRED_MESSAGE =
  'Select if you want to go to the record of the relationship or go to the prisoner’s contact list'

export const deleteRelationshipSchema = createSchema({
  deleteRelationshipAction: z.enum(['DELETE', 'GO_TO_CONTACT_LIST', 'GO_TO_CONTACT_RECORD'], {
    message: ACTION_REQUIRED_MESSAGE,
  }),
})

export type DeleteRelationshipSchemaType = z.infer<typeof deleteRelationshipSchema>
