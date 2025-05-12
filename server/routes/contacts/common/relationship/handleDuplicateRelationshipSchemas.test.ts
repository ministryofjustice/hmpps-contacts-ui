import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { handleDuplicateRelationshipSchemaFactory } from './handleDuplicateRelationshipSchemas'

describe('handleDuplicateRelationshipSchemaFactory', () => {
  type Form = {
    duplicateAction: string
  }
  describe('should validate the duplicate relationship form', () => {
    it('should require an action', async () => {
      // Given
      const form = { duplicateAction: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        duplicateAction: ['Select if you want to go to the existing record or go to the prisoner’s contact list'],
      })
    })

    it.each(['GO_TO_CONTACT_LIST', 'GO_TO_DUPE'])(
      'should pass if one of the allowed actions is selected (%s)',
      async duplicateAction => {
        // Given
        const form = { duplicateAction }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(true)
      },
    )

    const doValidate = async (form: Form) => {
      const schema = await handleDuplicateRelationshipSchemaFactory()()
      return schema.safeParse(form)
    }
  })
})
