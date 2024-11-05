import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { identitySchemaFactory } from './IdentitySchemas'

describe('identitySchemaFactory', () => {
  type Form = {
    type: string
    identity: string
    issuingAuthority: string
  }
  const baseForm: Form = {
    type: '',
    identity: '',
    issuingAuthority: '',
  }
  describe('should validate a identity number form', () => {
    it('should require type', async () => {
      // Given
      const form = { ...baseForm, identity: '123456' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({ type: ['Select the type of identity number'] })
    })

    it('should require identity number', async () => {
      // Given
      const form = { ...baseForm, type: 'PASSPORT' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({ identity: ['Enter the identity number'] })
    })

    it('identity number should be limited to 20 chars', async () => {
      // Given
      const form = {
        type: 'PASSPORT',
        identity: ''.padEnd(21, '1'),
        issuingAuthority: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        identity: ['Identity number should be 20 characters or fewer'],
      })
    })

    it('issuing authority should be limited to 40 chars', async () => {
      // Given
      const form = {
        type: 'PASSPORT',
        identity: 'LAST-87736799M',
        issuingAuthority: ''.padEnd(41, '1'),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        issuingAuthority: ['Issuing authority should be 40 characters or fewer'],
      })
    })

    const doValidate = async (form: Form) => {
      const schema = await identitySchemaFactory()()
      return schema.safeParse(form)
    }
  })
})
