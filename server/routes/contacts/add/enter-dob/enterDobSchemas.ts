import { z } from 'zod'
import { createDateInputSchema, DateInputSchemaRule } from '../../../../utils/validation/dateSchema'

export const optionalDobSchema = createDateInputSchema({
  inputId: 'dob',
  inputDescription: 'date of birth',
  additionalRule: DateInputSchemaRule.MUST_BE_PAST,
  isOptional: true,
})

export type OptionalDobSchemaType = z.infer<typeof optionalDobSchema>
