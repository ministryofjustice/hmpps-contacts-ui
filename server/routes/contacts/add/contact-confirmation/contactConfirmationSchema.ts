import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_IS_THE_RIGHT_PERSON_MESSAGE = 'Select whether this is the right contact'

export const selectToConfirmContactSchema = () => async () => {
  return createSchema({
    isContactConfirmed: z.enum(['YES', 'NO'], { message: SELECT_IS_THE_RIGHT_PERSON_MESSAGE }),
  })
}

export type IsContactConfirmedSchema = z.infer<Awaited<ReturnType<ReturnType<typeof selectToConfirmContactSchema>>>>
