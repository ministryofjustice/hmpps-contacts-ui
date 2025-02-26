import { z } from 'zod'
import { createDateInputSchema, DateInputSchemaRule } from '../../../../utils/validation/dateSchema'

export const dateOfDeathSchema = createDateInputSchema({
  inputId: 'dateOfDeath',
  inputDescription: 'date of death',
  additionalRule: DateInputSchemaRule.MUST_BE_TODAY_OR_PAST,
})

export type DateOfDeathSchemaType = z.infer<typeof dateOfDeathSchema>
