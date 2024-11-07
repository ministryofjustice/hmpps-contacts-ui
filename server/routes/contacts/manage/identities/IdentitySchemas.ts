import z from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const TYPE_REQUIRED_MESSAGE = 'Select the type of identity number'

const IDENTITY_NUMBER_REQUIRED_MESSAGE = 'Enter the identity number'
const IDENTITY_NUMBER_TOO_LONG_ERROR_MSG = 'Identity number should be 20 characters or fewer'

const ISSUING_AUTHORITY_TOO_LONG_ERROR_MSG = 'Issuing authority should be 40 characters or fewer'

export const identitySchemaFactory = () => async () => {
  return createSchema({
    identity: z
      .string({ message: IDENTITY_NUMBER_REQUIRED_MESSAGE })
      .max(20, IDENTITY_NUMBER_TOO_LONG_ERROR_MSG)
      .refine(val => val?.trim().length > 0, { message: IDENTITY_NUMBER_REQUIRED_MESSAGE }),
    type: z
      .string({ message: TYPE_REQUIRED_MESSAGE })
      .refine(val => val?.trim().length > 0, { message: TYPE_REQUIRED_MESSAGE }),
    issuingAuthority: z
      .string()
      .max(40, ISSUING_AUTHORITY_TOO_LONG_ERROR_MSG)
      .optional()
      .transform(val => (val?.trim().length > 0 ? val.trim() : undefined)),
  })
}

export type IdentitySchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof identitySchemaFactory>>>>
