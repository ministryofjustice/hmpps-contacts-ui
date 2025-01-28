import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { selectNextOfKinSchema } from './nextOfKinSchemas'

describe('createNextOfKinSchema', () => {
  type Form = {
    isNextOfKin?: string
  }
  describe('should validate the next of kin form', () => {
    it('should require isNextOfKin', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        isNextOfKin: ['Select whether the contact is next of kin for the prisoner'],
      })
    })

    const doValidate = async (form: Form) => {
      const schema = await selectNextOfKinSchema()()
      return schema.safeParse(form)
    }
  })
})
