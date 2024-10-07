import z from 'zod'
import { isValid, parse } from 'date-fns'
import { createSchema } from '../../../../middleware/validationMiddleware'

const LAST_NAME_REQUIRED_MESSAGE = "Enter the contact's last name"
const LAST_NAME_INVALID = "Contact's last name must not contain special characters"
const FIRST_NAME_INVALID = "Contact's first name must not contain special characters"
const MIDDLE_NAME_INVALID = "Contact's middle names must not contain special characters"
const DAY_TYPE_MESSAGE = 'Enter a valid day of the month (1-31)'
const MONTH_TYPE_MESSAGE = 'Enter a valid month (1-12)'
const YEAR_TYPE_MESSAGE = 'Enter a valid year. Must be at least 1900'
const DOB_IN_FUTURE_MESSAGE = 'The date of birth must not be in the future'
const DOB_IS_INVALID = 'The date of birth is invalid'

const NAME_REGEX = /^[a-zA-Z\s,.'-]*$/

export const contactSearchSchema = () => async () => {
  return createSchema({
    lastName: z
      .string({ message: LAST_NAME_REQUIRED_MESSAGE })
      .regex(NAME_REGEX, LAST_NAME_INVALID)
      .refine(val => val?.trim().length > 0, { message: LAST_NAME_REQUIRED_MESSAGE }),
    middleName: z
      .string()
      .regex(NAME_REGEX, MIDDLE_NAME_INVALID)
      .optional()
      .transform(val => (val?.trim().length > 0 ? val.trim() : undefined)),
    firstName: z
      .string()
      .regex(NAME_REGEX, FIRST_NAME_INVALID)
      .transform(val => val?.trim()),
    day: z.union([z.literal(''), z.coerce.number().min(1, DAY_TYPE_MESSAGE).max(31, DAY_TYPE_MESSAGE).optional()], {
      errorMap: () => ({ message: DAY_TYPE_MESSAGE }),
    }),
    month: z.union(
      [z.literal(''), z.coerce.number().min(1, MONTH_TYPE_MESSAGE).max(12, MONTH_TYPE_MESSAGE).optional()],
      {
        errorMap: () => ({ message: MONTH_TYPE_MESSAGE }),
      },
    ),
    year: z.union([z.literal(''), z.coerce.number().min(1900, YEAR_TYPE_MESSAGE).optional()], {
      errorMap: () => ({ message: YEAR_TYPE_MESSAGE }),
    }),
  })
    .superRefine((val, ctx) => {
      if (val.lastName && (val.day || val.month || val.year)) {
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
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: DOB_IN_FUTURE_MESSAGE, path: ['dob'] })
          }

          const validate = parse(`${val.year}.${val.month}.${val.day}`, 'yyyy.MM.dd', new Date())

          if (!isValid(validate)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: DOB_IS_INVALID, path: ['dob'] })
          }
        }
      }
    })
    .transform(
      (
        val,
      ): { lastName?: string; middleName?: string; firstName: string; day?: number; month?: number; year?: number } => {
        return {
          lastName: val.lastName as string,
          middleName: val.middleName as string,
          firstName: val.firstName as string,
          day: val.day as number,
          month: val.month as number,
          year: val.year as number,
        }
      },
    )
}
export type ContactSearchSchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof contactSearchSchema>>>>
