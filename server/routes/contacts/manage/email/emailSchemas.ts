import { RefinementCtx, z } from 'zod'
import { Request } from 'express'
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

const validateEmailFormat = (emailAddress: string | undefined, ctx: RefinementCtx, path: (string | number)[]) => {
  if (emailAddress && !emailAddress.match(EMAIL_REGEX)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: EMAIL_FORMAT_ERROR_MESSAGE, path })
  }
}

const validateEmailIsNotDuplicate = (
  emailAddress: string | undefined,
  otherEmailAddresses: string[],
  ctx: RefinementCtx,
  path: (string | number)[],
) => {
  if (emailAddress && otherEmailAddresses.map(sanitiseEmail).indexOf(sanitiseEmail(emailAddress)) >= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Email address ‘${emailAddress}’ has already been entered for this contact`,
      path,
    })
  }
}

export const emailSchema = createSchema({
  emailAddress: z
    .string()
    .max(240, EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE)
    .refine(val => val?.trim().length > 0, { message: EMAIL_REQUIRED_ERROR_MESSAGE }),
  otherEmailAddresses: z.array(z.string()).optional(),
})
  .superRefine((val, ctx) => {
    const { emailAddress } = val
    validateEmailFormat(emailAddress, ctx, ['emailAddress'])
    validateEmailIsNotDuplicate(emailAddress, val.otherEmailAddresses ?? [], ctx, ['emailAddress'])
  })
  .transform((val): { emailAddress: string } => {
    return {
      emailAddress: val.emailAddress,
    }
  })

const requiredEmailSchema = createSchema({
  emailAddress: z
    .string()
    .max(240, EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE)
    .refine(val => val?.trim().length > 0, { message: EMAIL_REQUIRED_ERROR_MESSAGE }),
})

const blankEmailSchema = createSchema({ emailAddress: z.string().optional() })

export const emailsSchema = () => async (request: Request<unknown, unknown, { save?: string }>) => {
  const isSaveAction = typeof request.body.save !== 'undefined'
  const childSchema = isSaveAction ? requiredEmailSchema : blankEmailSchema
  return createSchema({
    emails: z.array(childSchema),
    otherEmailAddresses: z.array(z.string()).optional(),
    save: z.string().optional(),
    add: z.string().optional(),
    remove: z.string().optional(),
  }).superRefine((val, ctx) => {
    if (isSaveAction) {
      const otherEmailAddresses: string[] = val.otherEmailAddresses ?? []
      for (let i = 0; i < val.emails.length; i += 1) {
        const email = val.emails[i]
        if (email && email.emailAddress) {
          validateEmailFormat(email.emailAddress, ctx, ['emails', i, 'emailAddress'])
          validateEmailIsNotDuplicate(email.emailAddress, otherEmailAddresses, ctx, ['emails', i, 'emailAddress'])
          otherEmailAddresses.push(email.emailAddress) // in case they enter twice in this form
        }
      }
    }
  })
}

export const optionalEmailsSchema = async (
  request: Request<unknown, unknown, { save?: string; emails?: { emailAddress?: string }[] }>,
) => {
  const isSaveAction = request.body.save !== undefined
  const isAllBlank = request.body.emails?.every(({ emailAddress }) => emailAddress === '')
  const childSchema = !isSaveAction || isAllBlank ? blankEmailSchema : requiredEmailSchema
  return createSchema({
    emails: z.array(childSchema),
    otherEmailAddresses: z.array(z.string()).optional(),
    save: z.string().optional(),
    add: z.string().optional(),
    remove: z.string().optional(),
  })
    .superRefine((val, ctx) => {
      if (isSaveAction) {
        const otherEmailAddresses: string[] = val.otherEmailAddresses ?? []
        for (let i = 0; i < val.emails.length; i += 1) {
          const email = val.emails[i]
          if (email && email.emailAddress) {
            validateEmailFormat(email.emailAddress, ctx, ['emails', i, 'emailAddress'])
            validateEmailIsNotDuplicate(email.emailAddress, otherEmailAddresses, ctx, ['emails', i, 'emailAddress'])
            otherEmailAddresses.push(email.emailAddress) // in case they enter twice in this form
          }
        }
      }
    })
    .transform(({ emails, add, save, remove }) => ({
      emails: isAllBlank ? undefined : emails.map(email => ({ emailAddress: email.emailAddress! })),
      save,
      add,
      remove,
    }))
}

export type EmailSchemaType = z.infer<typeof emailSchema>
export type EmailsSchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof emailsSchema>>>>
export type OptionalEmailsSchemaType = z.infer<Awaited<ReturnType<typeof optionalEmailsSchema>>>
