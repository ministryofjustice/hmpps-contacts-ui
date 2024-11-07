import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const TYPE_REQUIRED_MESSAGE = 'Select the type of phone number'

const PHONE_NUMBER_REQUIRED_MESSAGE = 'Enter a phone number'
const PHONE_NUMBER_TOO_LONG_ERROR_MSG = 'Phone number should be 20 digits or fewer'

const EXT_TOO_LONG_ERROR_MSG = 'Extension should be 7 characters or fewer'

const PHONE_IS_INVALID = 'The phone number you entered is invalid, check the format and try again'

const PHONE_REGEX = /^\+?[\d\s()]*$/

export const phoneNumberSchemaFactory = () => async () => {
  return createSchema({
    phoneNumber: z
      .string({ message: PHONE_NUMBER_REQUIRED_MESSAGE })
      .max(20, PHONE_NUMBER_TOO_LONG_ERROR_MSG)
      .regex(PHONE_REGEX, PHONE_IS_INVALID)
      .refine(val => val?.trim().length > 0, { message: PHONE_NUMBER_REQUIRED_MESSAGE }),
    type: z
      .string({ message: TYPE_REQUIRED_MESSAGE })
      .refine(val => val?.trim().length > 0, { message: TYPE_REQUIRED_MESSAGE }),
    extension: z
      .string()
      .max(7, EXT_TOO_LONG_ERROR_MSG)
      .optional()
      .transform(val => (val?.trim().length > 0 ? val.trim() : undefined)),
  })
}

export type PhoneNumberSchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof phoneNumberSchemaFactory>>>>
