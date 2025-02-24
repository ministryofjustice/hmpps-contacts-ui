import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'Select whether the contact is a staff member'

export const manageContactStaffSchema = createSchema({
  isStaff: z.enum(['YES', 'NO'], { message: REQUIRED_MESSAGE }),
})

export type ManageContactStaffSchemaType = z.infer<typeof manageContactStaffSchema>
