import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const ACTION_REQUIRED_MESSAGE = 'Select if you want to go to the existing record or go to the prisoner’s contact list'

export const handleDuplicateRelationshipSchemaFactory = () => async () => {
  return createSchema({
    duplicateAction: z.enum(['GO_TO_CONTACT_LIST', 'GO_TO_DUPE'], { message: ACTION_REQUIRED_MESSAGE }),
  })
}

export type HandleDuplicateRelationshipSchema = z.infer<
  Awaited<ReturnType<ReturnType<typeof handleDuplicateRelationshipSchemaFactory>>>
>
