import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'Select the contact’s domestic status'

export const manageDomesticStatusSchema = createSchema({
  domesticStatusCode: z.string({ message: REQUIRED_MESSAGE }).trim().min(1, { message: REQUIRED_MESSAGE }),
})

export type ManageDomesticStatusSchemaType = z.infer<typeof manageDomesticStatusSchema>
