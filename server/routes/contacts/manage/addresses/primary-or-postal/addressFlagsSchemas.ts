import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'Select whether this address is the current primary or postal address for the contact'

type parsedType = {
  primaryAddress: boolean | undefined
  mailAddress: boolean | undefined
}

const isPrimaryOrPostalEnum = z.enum(['P', 'M', 'PM', 'NONE'], { message: REQUIRED_MESSAGE })

export const addressFlagsSchema = (isOptional: boolean = true) =>
  createSchema({
    isPrimaryOrPostal: isOptional ? isPrimaryOrPostalEnum.optional() : isPrimaryOrPostalEnum,
  }).transform(val => {
    let result: parsedType
    switch (val.isPrimaryOrPostal) {
      case 'P':
        result = { primaryAddress: true, mailAddress: false }
        break
      case 'M':
        result = { primaryAddress: false, mailAddress: true }
        break
      case 'PM':
        result = { primaryAddress: true, mailAddress: true }
        break
      case 'NONE':
        result = { primaryAddress: false, mailAddress: false }
        break
      default:
        result = { primaryAddress: undefined, mailAddress: undefined }
    }
    return result
  })

export type AddressFlagsSchemaType = z.infer<ReturnType<typeof addressFlagsSchema>>
