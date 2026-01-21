import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const LAST_NAME_REQUIRED_MESSAGE = 'Enter the contact’s last name'
const LAST_NAME_TOO_LONG_ERROR_MSG = 'Contact’s last name must be 35 characters or less'
const LAST_NAME_INVALID_PREFIX = 'Contact’s last name must not contain '

const FIRST_NAME_REQUIRED_MESSAGE = 'Enter the contact’s first name'
const FIRST_NAME_TOO_LONG_ERROR_MSG = 'Contact’s first name must be 35 characters or less'
const FIRST_NAME_INVALID_PREFIX = 'Contact’s first name must not contain '

const MIDDLE_NAME_TOO_LONG_ERROR_MSG = 'Contact’s middle names must be 35 characters or less'
const MIDDLE_NAME_INVALID_PREFIX = 'Contact’s middle names must not contain '

// Keep these in sync as VALID_CHAR_REGEX is used to extract the non-matching chars for the error
export const NAME_REGEX = /^[a-zA-Z\s,.'-]*$/
const VALID_CHAR_REGEX = /[a-zA-Z\s,.'-]/g

const lf = new Intl.ListFormat('en')
const getUniqueInvalidChars = (value?: string) => {
  return lf.format(new Set(value?.toString()?.replace(VALID_CHAR_REGEX, '') ?? ''))
}

export const fullNameSchema = createSchema({
  title: z
    .string()
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined))
    .transform(val => val?.trim()),
  firstName: z
    .string()
    .max(35, FIRST_NAME_TOO_LONG_ERROR_MSG)
    .superRefine((val, ctx) => {
      if (!NAME_REGEX.test(val)) {
        ctx.addIssue({ code: 'custom', message: `${FIRST_NAME_INVALID_PREFIX}${getUniqueInvalidChars(val)}` })
      }
    })
    .refine(val => val?.trim().length > 0, { message: FIRST_NAME_REQUIRED_MESSAGE })
    .transform(val => val?.trim()),
  middleNames: z
    .string()
    .max(35, MIDDLE_NAME_TOO_LONG_ERROR_MSG)
    .superRefine((val, ctx) => {
      if (!NAME_REGEX.test(val)) {
        ctx.addIssue({ code: 'custom', message: `${MIDDLE_NAME_INVALID_PREFIX}${getUniqueInvalidChars(val)}` })
      }
    })
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  lastName: z
    .string()
    .max(35, LAST_NAME_TOO_LONG_ERROR_MSG)
    .superRefine((val, ctx) => {
      if (!NAME_REGEX.test(val)) {
        ctx.addIssue({ code: 'custom', message: `${LAST_NAME_INVALID_PREFIX}${getUniqueInvalidChars(val)}` })
      }
    })
    .refine(val => val?.trim().length > 0, { message: LAST_NAME_REQUIRED_MESSAGE }),
})

export type FullNameSchemaType = z.infer<typeof fullNameSchema>
