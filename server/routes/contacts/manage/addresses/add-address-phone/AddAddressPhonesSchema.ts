import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'
import { phoneNumberSchema } from '../../phone/phoneSchemas'

export const phonesSchema = createSchema({
  phones: z.array(phoneNumberSchema),
  save: z.string().optional(),
  add: z.string().optional(),
  remove: z.string().optional(),
})

export type PhonesSchemaType = z.infer<typeof phonesSchema>
