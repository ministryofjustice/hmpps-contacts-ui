import z from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const ADDRESS_TYPE_REQUIRED_MESSAGE = `Select the address type`

export const addressTypeSchema = () => async () => {
  return createSchema({
    addressType: z.string({ message: ADDRESS_TYPE_REQUIRED_MESSAGE }),
  })
}

export type AddressTypeSchema = z.infer<Awaited<ReturnType<ReturnType<typeof addressTypeSchema>>>>
