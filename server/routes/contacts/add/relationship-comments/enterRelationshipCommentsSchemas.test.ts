import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { enterRelationshipCommentsSchema } from './enterRelationshipCommentsSchemas'

describe('enterRelationshipCommentsSchemas', () => {
  type Form = {
    comments?: string
  }
  describe('should validate the relationship comments form', () => {
    it('should not require comments', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data!.comments).toBeUndefined()
    })

    it.each(['', '      '])('should be no comments if blank', async (comments: string) => {
      // Given
      const form = { comments }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data!.comments).toBeUndefined()
    })

    it('should require comments to be less than 240', async () => {
      // Given
      const form = { comments: ' '.padEnd(241) }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        comments: ['Comments must be 240 characters or less'],
      })
    })

    const doValidate = async (form: Form) => {
      return enterRelationshipCommentsSchema.safeParse(form)
    }
  })
})
