import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'No answer selected'

export const editContactConfirmSchema = createSchema({
  confirmContactEdit: z.enum(['YES', 'NO'], { message: REQUIRED_MESSAGE }),
})

export type EditContactConfirmSchemaType = z.infer<typeof editContactConfirmSchema>
