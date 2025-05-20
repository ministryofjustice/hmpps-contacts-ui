import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const COUNTRY_REQUIRED_MESSAGE = 'Select a country'
const FLAT_TOO_LONG_ERROR_MSG = 'Flat or building unit must be 30 characters or less'
const PREMISES_TOO_LONG_ERROR_MSG = 'Building name must be 50 characters or less'
const STREET_TOO_LONG_ERROR_MSG = 'Street number and name must be 160 characters or less'
const LOCALITY_TOO_LONG_ERROR_MSG = 'District or locality must be 70 characters or less'
const POSTCODE_TOO_LONG_ERROR_MSG = 'Postcode must be 12 characters or less'

export const addressLinesSchema = createSchema({
  noFixedAddress: z
    .string()
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  flat: z
    .string()
    .max(30, FLAT_TOO_LONG_ERROR_MSG)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  property: z
    .string()
    .max(50, PREMISES_TOO_LONG_ERROR_MSG)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  street: z
    .string()
    .max(160, STREET_TOO_LONG_ERROR_MSG)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  area: z
    .string()
    .max(70, LOCALITY_TOO_LONG_ERROR_MSG)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  cityCode: z
    .string()
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  countyCode: z
    .string()
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  postcode: z
    .string()
    .max(12, POSTCODE_TOO_LONG_ERROR_MSG)
    .optional()
    .transform(val => (val?.trim()?.length ? val?.trim() : undefined)),
  countryCode: z
    .string({ message: COUNTRY_REQUIRED_MESSAGE })
    .refine(val => val?.trim().length > 0, { message: COUNTRY_REQUIRED_MESSAGE }),
})

export type AddressLinesSchema = z.infer<typeof addressLinesSchema>
