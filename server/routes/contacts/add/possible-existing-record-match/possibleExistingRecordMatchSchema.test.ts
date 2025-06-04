import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { possibleExistingRecordMatchSchema } from './possibleExistingRecordMatchSchema'

describe('PossibleExistingRecordMatchSchema', () => {
  type Form = {
    isPossibleExistingRecordMatched?: string
  }
  describe('should validate the contact confirmation form', () => {
    it('should require isContactMatched', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        isPossibleExistingRecordMatched: ['Select if this is the correct contact or not'],
      })
    })

    it.each(['YES', 'NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS', 'NO_CONTINUE_ADDING_CONTACT'])(
      'should accept if one of the allowed values %s',
      async (isPossibleExistingRecordMatched: string) => {
        // Given
        const form = { isPossibleExistingRecordMatched }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(true)
      },
    )

    const doValidate = async (form: Form) => {
      return possibleExistingRecordMatchSchema.safeParse(form)
    }
  })
})
