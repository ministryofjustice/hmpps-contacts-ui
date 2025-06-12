import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_IS_THE_RIGHT_PERSON_MESSAGE = 'Select if this is the correct contact or not'

export const contactMatchSchema = createSchema({
  isContactMatched: z.enum(['YES', 'NO_SEARCH_AGAIN', 'NO_CREATE_NEW', 'NO_GO_BACK_TO_CONTACT_LIST'], {
    message: SELECT_IS_THE_RIGHT_PERSON_MESSAGE,
  }),
})

export type IsContactMatchedSchema = z.infer<typeof contactMatchSchema>
