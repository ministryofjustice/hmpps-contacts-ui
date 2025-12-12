import { z } from 'zod'
import { createSchema, makeErrorMap } from '../../../../middleware/validationMiddleware'

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
    .string(
      makeErrorMap({
        invalid_string: value => FIRST_NAME_INVALID_PREFIX + getUniqueInvalidChars(value?.toString()),
      }),
    )
    .max(35, FIRST_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX)
    .refine(val => val?.trim().length > 0, { message: FIRST_NAME_REQUIRED_MESSAGE })
    .transform(val => val?.trim()),
  middleNames: z
    .string(
      makeErrorMap({
        invalid_string: value => MIDDLE_NAME_INVALID_PREFIX + getUniqueInvalidChars(value?.toString()),
      }),
    )
    .max(35, MIDDLE_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  lastName: z
    .string(
      makeErrorMap({
        invalid_string: value => LAST_NAME_INVALID_PREFIX + getUniqueInvalidChars(value?.toString()),
      }),
    )
    .max(35, LAST_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX)
    .refine(val => val?.trim().length > 0, { message: LAST_NAME_REQUIRED_MESSAGE }),
})

export const restrictedEditingNameSchema = createSchema({
  title: z
    .string()
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined))
    .transform(val => val?.trim()),
  firstName: z.string().optional(),
  middleNames: z
    .string(
      makeErrorMap({
        invalid_string: value => MIDDLE_NAME_INVALID_PREFIX + getUniqueInvalidChars(value?.toString()),
      }),
    )
    .max(35, MIDDLE_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  lastName: z.string().optional(),
})

export type FullNameSchemaType = z.infer<typeof fullNameSchema>
export type RestrictedEditingNameSchemaType = z.infer<typeof restrictedEditingNameSchema>
