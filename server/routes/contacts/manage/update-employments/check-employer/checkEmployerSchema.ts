import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const ERROR_MESSAGE = 'Select whether this is the correct employer'

export const checkEmployerSchema = createSchema({
  isCorrectEmployer: z.enum(['YES', 'NO'], { message: ERROR_MESSAGE }),
})

export type IsCorrectEmployerSchema = z.infer<typeof checkEmployerSchema>
