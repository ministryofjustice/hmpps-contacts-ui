import z from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const COMMENTS_TOO_LONG_ERROR_MESSAGE = 'Address comment must be 240 characters or less'

const START_DATE_REQUIRED_MESSAGE = 'Enter the date when the contact started using the address'
const START_MONTH_REQUIRED_MESSAGE = 'Start date must include a month'
const START_MONTH_INVALID_MESSAGE = 'Start month must be a real month'
const START_YEAR_REQUIRED_MESSAGE = 'Start date must include a year'
const START_YEAR_INVALID_MESSAGE = 'Start year must be a real year'

const END_MONTH_REQUIRED_MESSAGE = 'End date must include a month'
const END_MONTH_INVALID_MESSAGE = 'End month must be a real month'
const END_YEAR_REQUIRED_MESSAGE = 'End date must include a year'
const END_YEAR_INVALID_MESSAGE = 'End year must be a real year'

export const addressMetadataSchema = () => async () => {
  return createSchema({
    fromMonth: z
      .union(
        [
          z.literal(''),
          z.coerce
            .number({ message: START_MONTH_INVALID_MESSAGE })
            .min(1, START_MONTH_INVALID_MESSAGE)
            .max(12, START_MONTH_INVALID_MESSAGE)
            .optional(),
        ],
        { errorMap: () => ({ message: START_MONTH_INVALID_MESSAGE }) },
      )
      .transform(val => val.toString()),
    fromYear: z
      .union(
        [
          z.literal(''),
          z.coerce //
            .number({ message: START_YEAR_INVALID_MESSAGE })
            .min(1900, START_YEAR_INVALID_MESSAGE)
            .optional(),
        ],
        { errorMap: () => ({ message: START_YEAR_INVALID_MESSAGE }) },
      )
      .transform(val => val.toString()),
    toMonth: z
      .union(
        [
          z.literal(''),
          z.coerce
            .number({ message: END_MONTH_INVALID_MESSAGE })
            .min(1, END_MONTH_INVALID_MESSAGE)
            .max(12, END_MONTH_INVALID_MESSAGE)
            .optional(),
        ],
        { errorMap: () => ({ message: END_MONTH_INVALID_MESSAGE }) },
      )
      .transform(val => val.toString()),
    toYear: z
      .union(
        [
          z.literal(''),
          z.coerce //
            .number({ message: END_YEAR_INVALID_MESSAGE })
            .min(1900, END_YEAR_INVALID_MESSAGE)
            .optional(),
        ],
        { errorMap: () => ({ message: END_YEAR_INVALID_MESSAGE }) },
      )
      .transform(val => val.toString()),
    primaryAddress: z.string().optional(),
    mailAddress: z.string().optional(),
    comments: z.string().max(30, COMMENTS_TOO_LONG_ERROR_MESSAGE).optional(),
  }).superRefine((val, ctx) => {
    if (val.fromMonth && !val.fromYear) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: START_YEAR_REQUIRED_MESSAGE, path: ['fromYear'] })
    } else if (!val.fromMonth && val.fromYear) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: START_MONTH_REQUIRED_MESSAGE, path: ['fromMonth'] })
    } else if (!val.fromMonth && !val.fromYear) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: START_DATE_REQUIRED_MESSAGE, path: ['fromDate'] })
    }
    if (val.toMonth && !val.toYear) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: END_YEAR_REQUIRED_MESSAGE, path: ['toYear'] })
    } else if (!val.toMonth && val.toYear) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: END_MONTH_REQUIRED_MESSAGE, path: ['toMonth'] })
    }
  })
}

export type AddressMetadataSchema = z.infer<Awaited<ReturnType<ReturnType<typeof addressMetadataSchema>>>>
