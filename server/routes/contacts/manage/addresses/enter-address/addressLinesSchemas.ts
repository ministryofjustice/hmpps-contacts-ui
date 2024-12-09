import z from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const COUNTRY_REQUIRED_MESSAGE = 'Select a country'
const FLAT_TOO_LONG_ERROR_MSG = 'Flat must be 30 characters or less'
const PREMISES_TOO_LONG_ERROR_MSG = 'Premises must be 50 characters or less'
const STREET_TOO_LONG_ERROR_MSG = 'Street must be 160 characters or less'
const LOCALITY_TOO_LONG_ERROR_MSG = 'Locality must be 70 characters or less'
const POSTCODE_TOO_LONG_ERROR_MSG = 'Postcode must be 12 characters or less'

export const addressLinesSchema = () => async () => {
  return createSchema({
    noFixedAddress: z.string().optional(),
    flat: z.string().max(30, FLAT_TOO_LONG_ERROR_MSG).optional(),
    premises: z.string().max(50, PREMISES_TOO_LONG_ERROR_MSG).optional(),
    street: z.string().max(160, STREET_TOO_LONG_ERROR_MSG).optional(),
    locality: z.string().max(70, LOCALITY_TOO_LONG_ERROR_MSG).optional(),
    town: z.string().optional(),
    county: z.string().optional(),
    postcode: z.string().max(12, POSTCODE_TOO_LONG_ERROR_MSG).optional(),
    country: z
      .string({ message: COUNTRY_REQUIRED_MESSAGE })
      .refine(val => val?.trim().length > 0, { message: COUNTRY_REQUIRED_MESSAGE }),
  })
}

export type AddressLinesSchema = z.infer<Awaited<ReturnType<ReturnType<typeof addressLinesSchema>>>>
