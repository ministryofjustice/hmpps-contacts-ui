import { z } from 'zod'
import { createDateInputSchema, DateInputSchemaRule } from '../../../../utils/validation/dateSchema'

const requestSchema = {
  inputId: 'dob',
  inputDescription: 'date of birth',
  additionalRule: DateInputSchemaRule.MUST_BE_PAST,
  isOptional: true,
  additionalParams: {
    lastName: z.string().optional(),
    middleNames: z.string().optional(),
    firstName: z.string().optional(),
    contactId: z.string().optional(),
    soundsLike: z.string().optional(),
    searchType: z.string().optional(),
    sort: z.string().optional(),
  },
}

export const contactSearchSchema = createDateInputSchema(requestSchema)

export type ContactSearchSchemaType = z.infer<typeof contactSearchSchema>
