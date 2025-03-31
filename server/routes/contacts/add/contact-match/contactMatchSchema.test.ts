import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { contactMatchSchema } from './contactMatchSchema'

describe('IsContactConfirmedSchema', () => {
  type Form = {
    isContactMatched?: string
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
        isContactMatched: ['Select if this is the correct contact or not'],
      })
    })

    const doValidate = async (form: Form) => {
      return contactMatchSchema.safeParse(form)
    }
  })
})
