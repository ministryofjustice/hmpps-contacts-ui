import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { selectRelationshipSchemaFactory } from './selectRelationshipSchemas'

describe('selectRelationshipSchemas', () => {
  type Form = {
    relationship: string
  }
  describe('should validate the select relationship form', () => {
    it('should require the relationship', async () => {
      // Given
      const form = { relationship: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        relationship: ['Select the contact’s relationship to the prisoner'],
      })
    })

    it('should pass if relationship selected', async () => {
      // Given
      const form = { relationship: 'MOT' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    const doValidate = async (form: Form) => {
      const schema = await selectRelationshipSchemaFactory()()
      return schema.safeParse(form)
    }
  })
})
