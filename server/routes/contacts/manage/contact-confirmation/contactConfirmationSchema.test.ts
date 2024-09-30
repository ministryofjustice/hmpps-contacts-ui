import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { selectToConfirmContactSchema } from './contactConfirmationSchema'

describe('IsContactConfirmedSchema', () => {
  type Form = {
    isContactConfirmed?: string
  }
  describe('should validate the contact confirmation form', () => {
    it('should require isContactConfirmed', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        isContactConfirmed: ['Select whether this is the right contact'],
      })
    })

    const doValidate = async (form: Form) => {
      const schema = await selectToConfirmContactSchema()()
      return schema.safeParse(form)
    }
  })
})
