import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { enterEstimatedDobSchema } from './enterEstimatedDobSchemas'

describe('createContactEnterDobSchema', () => {
  type Form = {
    isKnown?: string
    day?: string
    month?: string
    year?: string
  }
  describe('should validate the enter dob form', () => {
    it('should require isContactOverEighteen', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({ isOverEighteen: ['Select whether the contact is over 18'] })
    })

    const doValidate = async (form: Form) => {
      const schema = await enterEstimatedDobSchema()()
      return schema.safeParse(form)
    }
  })
})
