import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_IS_OVER_18_MESSAGE = 'Select whether the contact is over 18'

export const createContactEnterEstimatedDobSchema = () => async () => {
  return createSchema({
    isOverEighteen: z.enum(['YES', 'NO', 'DO_NOT_KNOW'], { message: SELECT_IS_OVER_18_MESSAGE }),
  })
}

export type CreateContactEnterEstimatedDobSchemas = z.infer<
  Awaited<ReturnType<ReturnType<typeof createContactEnterEstimatedDobSchema>>>
>
