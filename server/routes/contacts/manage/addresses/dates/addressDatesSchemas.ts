import { z } from 'zod'
import { isValid, parse } from 'date-fns'
import { createSchema } from '../../../../../middleware/validationMiddleware'
import { formatDate } from '../../../../../utils/utils'

const START_DATE_REQUIRED_MESSAGE = 'Enter the date when the contact started using the address'
const START_MONTH_REQUIRED_MESSAGE = 'Start date must include a month'
const START_MONTH_INVALID_MESSAGE = 'Start month must be a real month'
const START_YEAR_REQUIRED_MESSAGE = 'Start date must include a year'
const START_YEAR_INVALID_MESSAGE = 'Start year must be a real year'

const END_MONTH_REQUIRED_MESSAGE = 'End date must include a month'
const END_MONTH_INVALID_MESSAGE = 'End month must be a real month'
const END_YEAR_REQUIRED_MESSAGE = 'End date must include a year'
const END_YEAR_INVALID_MESSAGE = 'End year must be a real year'

export const addressDatesSchema = createSchema({
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
    .transform(val => val?.toString()),
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
    .transform(val => val?.toString()),
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
    .transform(val => val?.toString()),
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
    .transform(val => val?.toString()),
}).transform((val, ctx) => {
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

  if (
    val.fromMonth &&
    val.fromYear &&
    val.toMonth &&
    val.toYear &&
    fromDateIsAfterToDate(val.fromMonth, val.fromYear, val.toMonth, val.toYear)
  ) {
    const formattedFromDate = formatDate(new Date(`${val.fromYear}-${val.fromMonth}-01`), 'MMMM yyyy')
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `End date must be the same as or after the start date ${formattedFromDate}`,
      path: ['toDate'],
    })
  }

  return {
    ...val,
    fromYear: val.fromYear!,
    fromMonth: val.fromMonth!,
  }
})

function fromDateIsAfterToDate(fromMonth: string, fromYear: string, toMonth: string, toYear: string): boolean {
  const fromDate = parse(`${fromYear}-${fromMonth}-01`, 'yyyy-MM-dd', new Date())
  const toDate = parse(`${toYear}-${toMonth}-01`, 'yyyy-MM-dd', new Date())
  return isValid(fromDate) && isValid(toDate) && fromDate > toDate
}

export type AddressDatesSchemaType = z.infer<typeof addressDatesSchema>
