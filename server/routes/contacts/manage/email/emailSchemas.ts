import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const EMAIL_REQUIRED_ERROR_MESSAGE = `Enter an email address`
const EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE = `Email address must be 240 characters or less`
const EMAIL_FORMAT_ERROR_MESSAGE = `Enter an email address in the correct format, like name@example.com`

// try to avoid duplicates based on case and padding
const sanitiseEmail = (emailAddress: string): string => {
  return emailAddress.trim().toLowerCase()
}
// something @ something . something and only one @
const EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]+$/

export const emailSchema = createSchema({
  emailAddress: z
    .string()
    .max(240, EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE)
    .refine(val => val?.trim().length > 0, { message: EMAIL_REQUIRED_ERROR_MESSAGE }),
  otherEmailAddresses: z.array(z.string()).optional(),
})
  .superRefine((val, ctx) => {
    if (val.emailAddress && !val.emailAddress.match(EMAIL_REGEX)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: EMAIL_FORMAT_ERROR_MESSAGE, path: ['emailAddress'] })
    }
    const sanitised = sanitiseEmail(val.emailAddress)
    if (
      val.emailAddress &&
      val.otherEmailAddresses &&
      val.otherEmailAddresses.map(sanitiseEmail).indexOf(sanitised) >= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Email address ‘${val.emailAddress}’ has already been entered for this contact`,
        path: ['emailAddress'],
      })
    }
  })
  .transform((val): { emailAddress: string } => {
    return {
      emailAddress: val.emailAddress,
    }
  })

export type EmailSchemaType = z.infer<typeof emailSchema>
