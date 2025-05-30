import { deleteRelationshipSchema } from './deleteRelationshipActionSchema'
import { deduplicateFieldErrors } from '../../../../../middleware/validationMiddleware'

describe('deleteRelationshipSchema', () => {
  type Form = {
    deleteRelationshipAction: string
  }
  describe('should validate the delete relationship form', () => {
    it('should require an action', async () => {
      // Given
      const form = { deleteRelationshipAction: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        deleteRelationshipAction: [
          'Select if you want to go to the record of the relationship or go to the prisoner’s contact list',
        ],
      })
    })

    it.each(['GO_TO_CONTACT_LIST', 'GO_TO_CONTACT_RECORD', 'DELETE'])(
      'should pass if one of the allowed actions is selected (%s)',
      async deleteRelationshipAction => {
        // Given
        const form = { deleteRelationshipAction }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(true)
      },
    )

    const doValidate = async (form: Form) => {
      return deleteRelationshipSchema.safeParse(form)
    }
  })
})
