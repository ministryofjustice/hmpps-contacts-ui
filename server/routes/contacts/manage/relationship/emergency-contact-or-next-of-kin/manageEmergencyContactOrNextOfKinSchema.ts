import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'Select whether the contact is an emergency contact or next of kin for the prisoner'

type parsedType = {
  emergencyContact: boolean
  nextOfKin: boolean
}

type optionalParsedType = {
  emergencyContact: boolean | undefined
  nextOfKin: boolean | undefined
}

export const manageEmergencyContactOrNextOfKinSchema = createSchema({
  isEmergencyContactOrNextOfKin: z.enum(['EC', 'NOK', 'ECNOK', 'NONE'], { message: REQUIRED_MESSAGE }),
}).transform(val => {
  let result: parsedType
  switch (val.isEmergencyContactOrNextOfKin) {
    case 'EC':
      result = { emergencyContact: true, nextOfKin: false }
      break
    case 'NOK':
      result = { emergencyContact: false, nextOfKin: true }
      break
    case 'ECNOK':
      result = { emergencyContact: true, nextOfKin: true }
      break
    case 'NONE':
    default:
      result = { emergencyContact: false, nextOfKin: false }
      break
  }
  return result
})

export const optionalEmergencyContactOrNextOfKinSchema = createSchema({
  isEmergencyContactOrNextOfKin: z.enum(['EC', 'NOK', 'ECNOK', 'NONE'], { message: REQUIRED_MESSAGE }).optional(),
}).transform(val => {
  let result: optionalParsedType
  switch (val.isEmergencyContactOrNextOfKin) {
    case 'EC':
      result = { emergencyContact: true, nextOfKin: false }
      break
    case 'NOK':
      result = { emergencyContact: false, nextOfKin: true }
      break
    case 'ECNOK':
      result = { emergencyContact: true, nextOfKin: true }
      break
    case 'NONE':
      result = { emergencyContact: false, nextOfKin: false }
      break
    default:
      result = { emergencyContact: undefined, nextOfKin: undefined }
      break
  }
  return result
})

export type ManageEmergencyContactOrNextOfKinSchemaType = z.infer<typeof manageEmergencyContactOrNextOfKinSchema>
export type OptionalEmergencyContactOrNextOfKinSchemaType = z.infer<typeof optionalEmergencyContactOrNextOfKinSchema>
