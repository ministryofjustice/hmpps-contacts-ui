import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const TYPE_REQUIRED_MESSAGE = 'Select the type of phone number'

const PHONE_NUMBER_REQUIRED_MESSAGE = 'Enter a phone number'
const PHONE_NUMBER_TOO_LONG_ERROR_MSG = 'Phone number must be 20 characters or less'

const EXT_TOO_LONG_ERROR_MSG = 'Extension must be 7 characters or less'

const PHONE_IS_INVALID = 'Enter a phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192'

const PHONE_REGEX = /^\+?[\d\s()]*$/

export const phoneNumberSchema = createSchema({
  type: z
    .string({ message: TYPE_REQUIRED_MESSAGE })
    .refine(val => val?.trim().length > 0, { message: TYPE_REQUIRED_MESSAGE }),
  phoneNumber: z
    .string({ message: PHONE_NUMBER_REQUIRED_MESSAGE })
    .max(20, PHONE_NUMBER_TOO_LONG_ERROR_MSG)
    .regex(PHONE_REGEX, PHONE_IS_INVALID)
    .refine(val => val?.trim().length > 0, { message: PHONE_NUMBER_REQUIRED_MESSAGE }),
  extension: z
    .string()
    .max(7, EXT_TOO_LONG_ERROR_MSG)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
})

export type PhoneNumberSchemaType = z.infer<typeof phoneNumberSchema>
