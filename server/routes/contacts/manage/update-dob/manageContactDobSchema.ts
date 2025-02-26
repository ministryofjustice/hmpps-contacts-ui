import { z } from 'zod'
import { createDateInputSchema, DateInputSchemaRule } from '../../../../utils/validation/dateSchema'

export const updateDobSchema = createDateInputSchema({
  inputId: 'dob',
  inputDescription: 'date of birth',
  additionalRule: DateInputSchemaRule.MUST_BE_PAST,
})

export type UpdateDobSchemaType = z.infer<typeof updateDobSchema>
