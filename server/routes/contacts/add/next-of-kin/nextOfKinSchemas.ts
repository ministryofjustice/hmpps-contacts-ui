import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_IS_NEXT_OF_KIN_MESSAGE = 'Select whether the contact is next of kin for the prisoner'

export const selectNextOfKinSchema = () => async () => {
  return createSchema({
    isNextOfKin: z.enum(['YES', 'NO'], { message: SELECT_IS_NEXT_OF_KIN_MESSAGE }),
  })
}

export type NextOfKinSchema = z.infer<Awaited<ReturnType<ReturnType<typeof selectNextOfKinSchema>>>>
