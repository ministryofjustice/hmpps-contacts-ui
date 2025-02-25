import { z } from 'zod'
import { isValid, parse } from 'date-fns'
import { createSchema } from '../../../../middleware/validationMiddleware'

const DATE_OF_DEATH_IS_REQUIRED_MESSAGE = 'Enter the date of death'
const SINGLE_FIELD_MISSING_ERROR = (field: string) => `Date of death must include a ${field}`
const TWO_FIELDS_MISSING_ERROR = (fieldOne: string, fieldTwo: string) =>
  `Date of death must include a ${fieldOne} and a ${fieldTwo}`
const YEAR_ERROR = 'Year must include 4 numbers'
const REAL_DATE_ERROR = 'Date of death must be a real date'
const FUTURE_DATE_ERROR = 'Date of death must be today or in the past'
const BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED = ''

export const dateOfDeathSchema = createSchema({
  day: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
})
  .superRefine((val, ctx) => {
    if (!val.day && !val.month && !val.year) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_OF_DEATH_IS_REQUIRED_MESSAGE, path: ['dateOfDeath'] })
    } else {
      const missing: string[] = []
      if (!val.day) {
        missing.push('day')
      }
      if (!val.month) {
        missing.push('month')
      }
      if (!val.year) {
        missing.push('year')
      }
      if (missing.length === 1) {
        const field = missing[0]!
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: SINGLE_FIELD_MISSING_ERROR(field), path: [field] })
      } else if (missing.length === 2) {
        const fieldOne = missing[0]!
        const fieldTwo = missing[1]!
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: TWO_FIELDS_MISSING_ERROR(fieldOne, fieldTwo),
          path: [fieldOne],
        })
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: [fieldTwo] })
      } else {
        const parsed = parse(`${val.year}-${val.month}-${val.day}`, 'yyyy-MM-dd', new Date())
        if (!isValid(parsed)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: REAL_DATE_ERROR, path: ['day'] })
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['month'] })
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
        } else if (parsed > new Date()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: FUTURE_DATE_ERROR, path: ['day'] })
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['month'] })
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
        }
      }
      if (val.year && val.year.length < 4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: YEAR_ERROR, path: ['year'] })
      }
    }
  })
  .transform((val): { month: number; year: number; day: number } => {
    return {
      day: Number(val.day),
      month: Number(val.month),
      year: Number(val.year),
    }
  })

export type DateOfDeathSchemaType = z.infer<typeof dateOfDeathSchema>
