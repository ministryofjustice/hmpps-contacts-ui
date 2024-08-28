import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const LAST_NAME_REQUIRED_MESSAGE = "Enter the contact's last name"
const LAST_NAME_TOO_LONG_ERROR_MSG = "Contact's last name must be 35 characters or less"

const FIRST_NAME_REQUIRED_MESSAGE = "Enter the contact's first name"
const FIRST_NAME_TOO_LONG_ERROR_MSG = "Contact's first name must be 35 characters or less"

const MIDDLE_NAME_TOO_LONG_ERROR_MSG = "Contact's middle name must be 35 characters or less"

export const schemaFactory = () => async () => {
  return createSchema({
    title: z.string().optional(),
    lastName: z
      .string({ message: LAST_NAME_REQUIRED_MESSAGE })
      .max(35, LAST_NAME_TOO_LONG_ERROR_MSG)
      .refine(val => val?.trim().length > 0, { message: LAST_NAME_REQUIRED_MESSAGE }),
    firstName: z
      .string({ message: FIRST_NAME_REQUIRED_MESSAGE })
      .max(35, FIRST_NAME_TOO_LONG_ERROR_MSG)
      .refine(val => val?.trim().length > 0, { message: FIRST_NAME_REQUIRED_MESSAGE }),
    middleName: z.string().max(35, MIDDLE_NAME_TOO_LONG_ERROR_MSG).optional(),
  })
}

export type SchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof schemaFactory>>>>
