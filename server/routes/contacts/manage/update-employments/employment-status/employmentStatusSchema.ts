import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const ERROR_MESSAGE = 'Select whether this employment is active or inactive'

export const employmentStatusSchema = createSchema({
  isActive: z.enum(['true', 'false'], { message: ERROR_MESSAGE }).transform(val => val === 'true'),
})

export type IsActiveEmploymentSchema = z.infer<typeof employmentStatusSchema>
