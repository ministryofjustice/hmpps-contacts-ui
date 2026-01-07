import { z } from 'zod'
import { createDateInputSchema, DateInputSchemaRule } from '../../../../utils/validation/dateSchema'

export const contactSearchSchema = createDateInputSchema({
  inputId: 'dob',
  inputDescription: 'date of birth',
  additionalRule: DateInputSchemaRule.MUST_BE_PAST,
  isOptional: true,
  additionalParams: {
    lastName: z.string().optional(),
    middleNames: z.string().optional(),
    firstName: z.string().optional(),
    contactId: z.string().optional(),
    searchType: z.string().optional(),
    sortBy: z.string().optional(),
    dobee: z.string().optional(),
  },
})

export type ContactSearchSchemaType = z.infer<typeof contactSearchSchema>
