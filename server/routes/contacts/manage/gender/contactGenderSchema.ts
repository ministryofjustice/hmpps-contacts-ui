import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'Select the contact’s gender'

export const contactGenderSchema = createSchema({
  gender: z.string({ message: REQUIRED_MESSAGE }).trim().min(1, { message: REQUIRED_MESSAGE }),
})

export type ContactGenderSchemaType = z.infer<typeof contactGenderSchema>
