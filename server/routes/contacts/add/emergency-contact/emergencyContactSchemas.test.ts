import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { selectEmergencyContactSchema } from './emergencyContactSchemas'

describe('createEmergencyContactSchema', () => {
  type Form = {
    isEmergencyContact?: string
  }
  describe('should validate the emergency contact form', () => {
    it('should require isEmergencyContact', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        isEmergencyContact: ['Select whether the contact is an emergency contact for the prisoner'],
      })
    })

    const doValidate = async (form: Form) => {
      const schema = await selectEmergencyContactSchema()()
      return schema.safeParse(form)
    }
  })
})
