import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_IS_EMERGENCY_CONTACT_MESSAGE = 'Select whether the contact is an emergency contact for the prisoner'

export const selectEmergencyContactSchema = () => async () => {
  return createSchema({
    isEmergencyContact: z.enum(['YES', 'NO'], { message: SELECT_IS_EMERGENCY_CONTACT_MESSAGE }),
  })
}

export type EmergencyContactSchema = z.infer<Awaited<ReturnType<ReturnType<typeof selectEmergencyContactSchema>>>>
