import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const EMAIL_REQUIRED_ERROR_MESSAGE = `Enter the contact's email address`
const EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE = `The contact's email address should be 240 characters or fewer`
const EMAIL_FORMAT_ERROR_MESSAGE = `Enter an email address in the correct format, like name@example.com`

export const emailSchemaFactory = () => async () => {
  return createSchema({
    emailAddress: z
      .string({ message: EMAIL_REQUIRED_ERROR_MESSAGE })
      // .min(1, {message: EMAIL_REQUIRED_ERROR_MESSAGE})
      .email({ message: EMAIL_FORMAT_ERROR_MESSAGE })
      .max(240, EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE)
      .refine(val => val?.trim().length > 0, { message: EMAIL_REQUIRED_ERROR_MESSAGE }),
  })
  // .superRefine((val, ctx) => {
  //   if (val.email) {
  //       ctx.addIssue({ code: z.ZodIssueCode.custom, message: EMAIL_REQUIRED_ERROR_MESSAGE, path: ['email'] })
  //   }
  // })
}

export type EmailSchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof emailSchemaFactory>>>>
