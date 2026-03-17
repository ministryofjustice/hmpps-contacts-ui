import { IdentityForm } from '../../../../@types/journeys'
import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { identitySchema, isADuplicateIdentity } from './IdentitySchemas'

describe('identitySchemaFactory', () => {
  type Form = {
    identityType: string
    identityValue: string
    issuingAuthority: string
  }
  const baseForm: Form = {
    identityType: '',
    identityValue: '',
    issuingAuthority: '',
  }

  describe('should validate a identity number form', () => {
    it('should require type', async () => {
      // Given
      const form = { ...baseForm, identityValue: '123456' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ identityType: ['Select the document type'] })
    })

    it('should require identity number', async () => {
      // Given
      const form = { ...baseForm, identityType: 'PASS' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ identityValue: ['Enter the document number'] })
    })

    it('identity number should be limited to 20 chars', async () => {
      // Given
      const form = {
        identityType: 'PASS',
        identityValue: ''.padEnd(21, '1'),
        issuingAuthority: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        identityValue: ['Document number must be 20 characters or less'],
      })
    })

    it('issuing authority should be limited to 40 chars', async () => {
      // Given
      const form = {
        identityType: 'PASS',
        identityValue: 'LAST-87736799M',
        issuingAuthority: ''.padEnd(41, '1'),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        issuingAuthority: ['Issuing authority must be 40 characters or less'],
      })
    })

    it('should require PNC numbers in required format', async () => {
      // Given
      const form = { ...baseForm, identityType: 'PNC', identityValue: '1923/1Z34567A' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        identityValue: ['Enter a PNC number in the correct format – for example, ‘22/1234567A’'],
      })
    })

    it('should accept PNC numbers in required format', async () => {
      // Given
      const form = { ...baseForm, identityType: 'PNC', identityValue: '2008/0056560Z' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('should present errors in field order', async () => {
      // Given
      const form = {
        identityValue: '',
        identityType: '',
        issuingAuthority: ''.padEnd(41, '1'),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(JSON.stringify(deduplicatedFieldErrors)).toBe(
        JSON.stringify({
          identityType: ['Select the document type'],
          identityValue: ['Enter the document number'],
          issuingAuthority: ['Issuing authority must be 40 characters or less'],
        }),
      )
    })

    const doValidate = async (form: Form) => {
      return identitySchema.safeParse(form)
    }
  })
})

describe('Duplicate identity check', () => {
  const existingIdentity: IdentityForm = {
    identityType: 'TYPE',
    identityValue: '123',
    issuingAuthority: 'AUTHORITY',
  }

  it('should handle a duplicate identity', () => {
    const newIdentity: IdentityForm = {
      identityType: 'TYPE',
      identityValue: '123',
    }
    expect(isADuplicateIdentity([existingIdentity], newIdentity)).toBe(true)
  })

  it('should handle a non-duplicate identity (different value)', () => {
    const newIdentity: IdentityForm = {
      identityType: 'TYPE',
      identityValue: '1234',
    }
    expect(isADuplicateIdentity([existingIdentity], newIdentity)).toBe(false)
  })

  it('should handle a non-duplicate identity (different type)', () => {
    const newIdentity: IdentityForm = {
      identityType: 'TYPE2',
      identityValue: '123',
    }
    expect(isADuplicateIdentity([existingIdentity], newIdentity)).toBe(false)
  })
})
