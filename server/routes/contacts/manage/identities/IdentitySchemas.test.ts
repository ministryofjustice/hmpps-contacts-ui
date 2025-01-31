import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { identitySchema } from './IdentitySchemas'

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
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ type: ['Select the type of identity number'] })
    })

    it('should require identity number', async () => {
      // Given
      const form = { ...baseForm, type: 'PASS' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ identity: ['Enter the identity number'] })
    })

    it('identity number should be limited to 20 chars', async () => {
      // Given
      const form = {
        type: 'PASS',
        identity: ''.padEnd(21, '1'),
        issuingAuthority: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        identity: ['Identity number should be 20 characters or fewer'],
      })
    })

    it('issuing authority should be limited to 40 chars', async () => {
      // Given
      const form = {
        type: 'PASS',
        identity: 'LAST-87736799M',
        issuingAuthority: ''.padEnd(41, '1'),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        issuingAuthority: ['Issuing authority should be 40 characters or fewer'],
      })
    })

    it('should require PNC numbers in required format', async () => {
      // Given
      const form = { ...baseForm, type: 'PNC', identity: '1923/1Z34567A' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ identity: ['Enter a PNC number in the correct format'] })
    })

    it('should accept PNC numbers in required format', async () => {
      // Given
      const form = { ...baseForm, type: 'PNC', identity: '2008/0056560Z' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('should present errors in field order', async () => {
      // Given
      const form = {
        identity: '',
        type: '',
        issuingAuthority: ''.padEnd(41, '1'),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(JSON.stringify(deduplicatedFieldErrors)).toBe(
        JSON.stringify({
          identity: ['Enter the identity number'],
          type: ['Select the type of identity number'],
          issuingAuthority: ['Issuing authority should be 40 characters or fewer'],
        }),
      )
    })

    const doValidate = async (form: Form) => {
      return identitySchema.safeParse(form)
    }
  })
})
