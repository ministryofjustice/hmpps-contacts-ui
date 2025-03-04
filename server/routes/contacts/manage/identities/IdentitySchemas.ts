import { z } from 'zod'
import { Request } from 'express'
import { createSchema } from '../../../../middleware/validationMiddleware'
import isValidPNC from '../../../../utils/pncValidation'

const TYPE_REQUIRED_MESSAGE = 'Select the document type'

const IDENTITY_NUMBER_REQUIRED_MESSAGE = 'Enter the document number'
const IDENTITY_NUMBER_TOO_LONG_ERROR_MSG = 'Document number must be 20 characters or less'

const ISSUING_AUTHORITY_TOO_LONG_ERROR_MSG = 'Issuing authority must be 40 characters or less'

const PNC_INVALID_MSG = 'Enter a PNC number in the correct format – for example, ‘22/1234567A’'

export const identitySchema = createSchema({
  type: z
    .string({ message: TYPE_REQUIRED_MESSAGE })
    .refine(val => val?.trim().length > 0, { message: TYPE_REQUIRED_MESSAGE }),
  identity: z
    .string({ message: IDENTITY_NUMBER_REQUIRED_MESSAGE })
    .max(20, IDENTITY_NUMBER_TOO_LONG_ERROR_MSG)
    .refine(val => val?.trim().length > 0, { message: IDENTITY_NUMBER_REQUIRED_MESSAGE }),
  issuingAuthority: z
    .string()
    .max(40, ISSUING_AUTHORITY_TOO_LONG_ERROR_MSG)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
}).superRefine((val, ctx) => {
  if (val.type === 'PNC' && !isValidPNC(val.identity)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: PNC_INVALID_MSG, path: ['identity'] })
  }
})

const blankIdentitySchema = createSchema({
  type: z.string().optional(),
  identity: z.string().optional(),
  issuingAuthority: z.string().optional(),
})

export const identitiesSchema = () => async (request: Request<unknown, unknown, { save?: string }>) => {
  const childSchema = typeof request.body.save !== 'undefined' ? identitySchema : blankIdentitySchema
  return createSchema({
    identities: z.array(childSchema),
    save: z.string().optional(),
    add: z.string().optional(),
    remove: z.string().optional(),
  })
}

export type IdentitySchemaType = z.infer<typeof identitySchema>
export type IdentitiesSchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof identitiesSchema>>>>
