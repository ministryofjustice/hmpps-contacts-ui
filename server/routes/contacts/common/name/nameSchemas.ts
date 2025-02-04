import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const LAST_NAME_REQUIRED_MESSAGE = 'Enter the contact’s last name'
const LAST_NAME_TOO_LONG_ERROR_MSG = 'Contact’s last name must be 35 characters or less'
const LAST_NAME_INVALID = 'Contact’s last name must not contain special characters'

const FIRST_NAME_REQUIRED_MESSAGE = 'Enter the contact’s first name'
const FIRST_NAME_TOO_LONG_ERROR_MSG = 'Contact’s first name must be 35 characters or less'
const FIRST_NAME_INVALID = 'Contact’s first name must not contain special characters'

const MIDDLE_NAME_TOO_LONG_ERROR_MSG = 'Contact’s middle names must be 35 characters or less'
const MIDDLE_NAME_INVALID = 'Contact’s middle names must not contain special characters'

const NAME_REGEX = /^[a-zA-Z\s,.'-]*$/

export const fullNameSchema = createSchema({
  title: z
    .string()
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined))
    .transform(val => val?.trim()),
  lastName: z
    .string({ message: LAST_NAME_REQUIRED_MESSAGE })
    .max(35, LAST_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX, LAST_NAME_INVALID)
    .refine(val => val?.trim().length > 0, { message: LAST_NAME_REQUIRED_MESSAGE }),
  firstName: z
    .string({ message: FIRST_NAME_REQUIRED_MESSAGE })
    .max(35, FIRST_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX, FIRST_NAME_INVALID)
    .refine(val => val?.trim().length > 0, { message: FIRST_NAME_REQUIRED_MESSAGE })
    .transform(val => val?.trim()),
  middleNames: z
    .string()
    .max(35, MIDDLE_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX, MIDDLE_NAME_INVALID)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
})

export const restrictedEditingNameSchema = createSchema({
  title: z
    .string()
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined))
    .transform(val => val?.trim()),
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  middleNames: z
    .string()
    .max(35, MIDDLE_NAME_TOO_LONG_ERROR_MSG)
    .regex(NAME_REGEX, MIDDLE_NAME_INVALID)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
})

export type FullNameSchemaType = z.infer<typeof fullNameSchema>
export type RestrictedEditingNameSchemaType = z.infer<typeof restrictedEditingNameSchema>
