import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_IS_DOB_KNOWN_MESSAGE = 'Select whether the date of birth is known'
const DAY_TYPE_MESSAGE = 'Enter a valid day of the month'
const MONTH_TYPE_MESSAGE = 'Enter a valid month'
const YEAR_TYPE_MESSAGE = 'Enter a valid year'
const DAY_REQUIRED_MESSAGE = 'Enter day'
const MONTH_REQUIRED_MESSAGE = 'Enter month'
const YEAR_REQUIRED_MESSAGE = 'Enter year'

export const createContactEnterDobSchema = () => async () => {
  return createSchema({
    isDobKnown: z.string({ message: SELECT_IS_DOB_KNOWN_MESSAGE }).transform(value => value === 'true'),
    day: z.coerce.number({ message: DAY_TYPE_MESSAGE }).optional(),
    month: z.coerce.number({ message: MONTH_TYPE_MESSAGE }).optional(),
    year: z.coerce.number({ message: YEAR_TYPE_MESSAGE }).optional(),
    dateOfBirth: z.date().optional(),
  })
    .superRefine((val, ctx) => {
      if (val.isDobKnown === true) {
        if (!val.day) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: DAY_REQUIRED_MESSAGE, path: ['day'] })
        }
        if (!val.month) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MONTH_REQUIRED_MESSAGE, path: ['month'] })
        }
        if (!val.year) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: YEAR_REQUIRED_MESSAGE, path: ['year'] })
        }
      }
    })
    .transform(val => {
      if (val.isDobKnown === true) {
        return { ...val, dateOfBirth: new Date(`${val.year}-${val.month}-${val.day}Z`) }
      }
      return val
    })
}

export type CreateContactEnterDobSchemaType = z.infer<
  Awaited<ReturnType<ReturnType<typeof createContactEnterDobSchema>>>
>
