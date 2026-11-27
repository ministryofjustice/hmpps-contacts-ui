import { z } from 'zod'
import { isValid, parse, startOfDay } from 'date-fns'
import { createSchema } from '../../middleware/validationMiddleware'

const WHEN_REQUIRED_MESSAGE = 'Select when this restriction should close'
const DATE_REQUIRED_MESSAGE = 'Enter the date the restriction should close'
const DATE_INVALID_MESSAGE = 'The close date must be a real date'
const DATE_NOT_FUTURE_MESSAGE = 'The close date must be after today'

export const closePrisonerRestrictionSchema = () => async () =>
  createSchema({
    when: z.enum(['TODAY', 'FUTURE'], { message: WHEN_REQUIRED_MESSAGE }),
    expiryDate: z
      .string()
      .optional()
      .transform(value => value?.trim() || undefined),
  }).superRefine((data, ctx) => {
    if (data.when !== 'FUTURE') return
    if (!data.expiryDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_REQUIRED_MESSAGE, path: ['expiryDate'] })
      return
    }
    const parsed = parse(data.expiryDate, 'dd/MM/yyyy', new Date())
    if (!isValid(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_INVALID_MESSAGE, path: ['expiryDate'] })
    } else if (parsed <= startOfDay(new Date())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_NOT_FUTURE_MESSAGE, path: ['expiryDate'] })
    }
  })

export type ClosePrisonerRestrictionSchemaType = z.infer<
  Awaited<ReturnType<ReturnType<typeof closePrisonerRestrictionSchema>>>
>
