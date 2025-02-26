import { z } from 'zod'
import { isValid, parse } from 'date-fns'
import { createSchema } from '../../middleware/validationMiddleware'
import { sentenceCase } from '../utils'

export enum DateInputSchemaRule {
  MUST_BE_TODAY_OR_PAST,
  MUST_BE_TODAY_OR_FUTURE,
  MUST_BE_PAST,
  MUST_BE_FUTURE,
}

export const createDateInputSchema = ({
  inputId,
  inputDescription,
  additionalRule,
}: {
  inputId: string
  inputDescription: string
  additionalRule?: DateInputSchemaRule
}) => {
  const DATE_IS_REQUIRED_MESSAGE = `Enter the ${sentenceCase(inputDescription, false)}`
  const SINGLE_FIELD_MISSING_ERROR = (field: string) =>
    `${sentenceCase(inputDescription, true)} must include a ${field}`
  const TWO_FIELDS_MISSING_ERROR = (fieldOne: string, fieldTwo: string) =>
    `${sentenceCase(inputDescription, true)} must include a ${fieldOne} and a ${fieldTwo}`
  const YEAR_ERROR = 'Year must include 4 numbers'
  const REAL_DATE_ERROR = `${sentenceCase(inputDescription, true)} must be a real date`
  const NOT_TODAY_OR_PAST_ERROR = `${sentenceCase(inputDescription, true)} must be today or in the past`
  const NOT_PAST_ERROR = `${sentenceCase(inputDescription, true)} must be in the past`
  const NOT_TODAY_OR_FUTURE_ERROR = `${sentenceCase(inputDescription, true)} must be today or in the future`
  const NOT_FUTURE_ERROR = `${sentenceCase(inputDescription, true)} must be in the future`
  const BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED = ''

  return createSchema({
    day: z.string().optional(),
    month: z.string().optional(),
    year: z.string().optional(),
  })
    .superRefine((val, ctx) => {
      if (!val.day && !val.month && !val.year) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_IS_REQUIRED_MESSAGE, path: [inputId] })
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
        } else if (val.year && val.year.length >= 4) {
          const parsed = parse(`${val.year}-${val.month}-${val.day}`, 'yyyy-MM-dd', new Date())
          if (!isValid(parsed)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: REAL_DATE_ERROR, path: ['day'] })
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['month'] })
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
          } else {
            const inputDateStr = parsed.toISOString().substring(0, 10)
            const todayStr = new Date().toISOString().substring(0, 10)
            if (additionalRule === DateInputSchemaRule.MUST_BE_TODAY_OR_PAST && inputDateStr > todayStr) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: NOT_TODAY_OR_PAST_ERROR, path: ['day'] })
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED,
                path: ['month'],
              })
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
            }
            if (additionalRule === DateInputSchemaRule.MUST_BE_PAST && inputDateStr >= todayStr) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: NOT_PAST_ERROR, path: ['day'] })
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED,
                path: ['month'],
              })
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
            }
            if (additionalRule === DateInputSchemaRule.MUST_BE_TODAY_OR_FUTURE && inputDateStr < todayStr) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: NOT_TODAY_OR_FUTURE_ERROR, path: ['day'] })
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED,
                path: ['month'],
              })
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
            }
            if (additionalRule === DateInputSchemaRule.MUST_BE_FUTURE && inputDateStr <= todayStr) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: NOT_FUTURE_ERROR, path: ['day'] })
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED,
                path: ['month'],
              })
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
            }
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
}
