import { deduplicateFieldErrors } from '../../../../../middleware/validationMiddleware'
import { addressTypeSchema } from './addressTypeSchemas'

describe('addressTypeSchemaFactory', () => {
  type Form = {
    addressType?: string
  }
  describe('should validate a address type form', () => {
    it('should require address type', async () => {
      // When
      const result = await doValidate({})

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        addressType: ['Select the address type'],
      })
    })

    const doValidate = async (form: Form) => {
      return addressTypeSchema.safeParse(form)
    }
  })
})
