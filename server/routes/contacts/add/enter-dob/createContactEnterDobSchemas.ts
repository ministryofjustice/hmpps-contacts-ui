import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'
import IsDateOfBirthKnownOptions = journeys.YesOrNo

const SELECT_IS_DOB_KNOWN_MESSAGE = 'Select whether the date of birth is known'
const DAY_TYPE_MESSAGE = 'Enter a valid day of the month (1-31)'
const MONTH_TYPE_MESSAGE = 'Enter a valid month (1-12)'
const YEAR_TYPE_MESSAGE = 'Enter a valid year. Must be at least 1900'
const DOB_IN_FUTURE_MESSAGE = 'The date of birth must not be in the future'

export const createContactEnterDobSchema = () => async () => {
  return createSchema({
    isKnown: z.string({ message: SELECT_IS_DOB_KNOWN_MESSAGE }),
    day: z.union(
      [
        z.literal(''),
        z.coerce //
          .number({ message: DAY_TYPE_MESSAGE })
          .min(1, DAY_TYPE_MESSAGE)
          .max(31, DAY_TYPE_MESSAGE)
          .optional(),
      ],
      { errorMap: () => ({ message: DAY_TYPE_MESSAGE }) },
    ),
    month: z.union(
      [
        z.literal(''),
        z.coerce
          .number({ message: MONTH_TYPE_MESSAGE })
          .min(1, MONTH_TYPE_MESSAGE)
          .max(12, MONTH_TYPE_MESSAGE)
          .optional(),
      ],
      { errorMap: () => ({ message: MONTH_TYPE_MESSAGE }) },
    ),
    year: z.union(
      [
        z.literal(''),
        z.coerce //
          .number({ message: YEAR_TYPE_MESSAGE })
          .min(1900, YEAR_TYPE_MESSAGE)
          .optional(),
      ],
      { errorMap: () => ({ message: YEAR_TYPE_MESSAGE }) },
    ),
    dateOfBirth: z.date().optional(),
  })
    .superRefine((val, ctx) => {
      if (val.isKnown === 'YES') {
        if (!val.day) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: DAY_TYPE_MESSAGE, path: ['day'] })
        }
        if (!val.month) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MONTH_TYPE_MESSAGE, path: ['month'] })
        }
        if (!val.year) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: YEAR_TYPE_MESSAGE, path: ['year'] })
        }
        if (val.day && val.month && val.year) {
          if (new Date(`${val.year}-${val.month}-${val.day}Z`) > new Date()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: DOB_IN_FUTURE_MESSAGE, path: ['isKnown'] })
          }
        }
      }
    })
    .transform((val): { isKnown: IsDateOfBirthKnownOptions; day?: number; month?: number; year?: number } => {
      if (val.isKnown === 'YES') {
        return {
          isKnown: 'YES',
          day: val.day as number,
          month: val.month as number,
          year: val.year as number,
        }
      }
      return { isKnown: 'NO' }
    })
}

export type CreateContactEnterDobSchemaType = z.infer<
  Awaited<ReturnType<ReturnType<typeof createContactEnterDobSchema>>>
>