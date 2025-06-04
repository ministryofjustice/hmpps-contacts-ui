import { z } from 'zod'
import { createSchema } from '../../../../middleware/validationMiddleware'

const SELECT_IS_THE_RIGHT_PERSON_MESSAGE = 'Select if this is the correct contact or not'

export const possibleExistingRecordMatchSchema = createSchema({
  isPossibleExistingRecordMatched: z.enum(
    ['YES', 'NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS', 'NO_CONTINUE_ADDING_CONTACT'],
    {
      message: SELECT_IS_THE_RIGHT_PERSON_MESSAGE,
    },
  ),
})

export type PossibleExistingRecordMatchSchema = z.infer<typeof possibleExistingRecordMatchSchema>
