import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const REQUIRED_MESSAGE = 'Select whether the contact is approved to visit the prisoner'

export const manageApprovedToVisitSchema = createSchema({
  isApprovedToVisit: z.enum(['YES', 'NO'], { message: REQUIRED_MESSAGE }),
})

export type ManageApprovedToVisitSchemaType = z.infer<typeof manageApprovedToVisitSchema>
