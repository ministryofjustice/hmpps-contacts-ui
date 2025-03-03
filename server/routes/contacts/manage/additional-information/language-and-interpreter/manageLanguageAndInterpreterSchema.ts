import { z } from 'zod'
import { createSchema } from '../../../../../middleware/validationMiddleware'

const LANGUAGE_REQUIRED_MESSAGE = 'Select the contact’s first language'
const INTERPRETER_REQUIRED_MESSAGE = 'Select whether the contact requires an interpreter'

export const manageLanguageAndInterpreterSchema = createSchema({
  language: z.string({ message: LANGUAGE_REQUIRED_MESSAGE }).trim().min(1, { message: LANGUAGE_REQUIRED_MESSAGE }),
  interpreterRequired: z.enum(['YES', 'NO'], { message: INTERPRETER_REQUIRED_MESSAGE }),
})

export type ManageLanguageAndInterpreterSchemaType = z.infer<typeof manageLanguageAndInterpreterSchema>
