import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { selectRelationshipTypeSchema } from './relationshipTypeSchema'

describe('createNextOfKinSchema', () => {
  type Form = {
    isNextOfKin?: string
  }
  describe('should validate the relationship type form', () => {
    it('should require relationshipType', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        relationshipType: ['Select if this is a social or official contact for the prisoner'],
      })
    })

    const doValidate = async (form: Form) => {
      const schema = await selectRelationshipTypeSchema()()
      return schema.safeParse(form)
    }
  })
})
