import { Request } from 'express'
import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { identitiesSchema, identitySchema } from './IdentitySchemas'

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

  describe('should validate a multiple identity number form', () => {
    it('should require type', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: '',
            identityValue: '132',
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)

      expect(deduplicatedFieldErrors).toStrictEqual({ 'identities[0].identityType': ['Select the document type'] })
    })

    it('should require identity number', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: 'DL',
            identityValue: '',
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ 'identities[0].identityValue': ['Enter the document number'] })
    })

    it('identity number should be limited to 20 chars', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: 'DL',
            identityValue: ''.padEnd(21, '1'),
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        'identities[0].identityValue': ['Document number must be 20 characters or less'],
      })
    })

    it('issuing authority should be limited to 40 chars', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: 'PASS',
            identityValue: 'LAST-87736799M',
            issuingAuthority: ''.padEnd(41, '1'),
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        'identities[0].issuingAuthority': ['Issuing authority must be 40 characters or less'],
      })
    })

    it('should require PNC numbers in required format', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: 'PNC',
            identityValue: '1923/1Z34567A',
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        'identities[0].identityValue': ['Enter a PNC number in the correct format – for example, ‘22/1234567A’'],
      })
    })

    it('should accept PNC numbers in required format', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: 'PNC',
            identityValue: '2008/0056560Z',
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('should handle multiple identities with errors', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: 'PASS',
            identityValue: 'LAST-87736799M',
            issuingAuthority: ''.padEnd(41, '1'),
          } as Form,
          {
            identityType: '',
            identityValue: 'LAST-87736799M',
          } as Form,
          {
            identityType: 'DL',
            identityValue: '',
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        'identities[0].issuingAuthority': ['Issuing authority must be 40 characters or less'],
        'identities[1].identityType': ['Select the document type'],
        'identities[2].identityValue': ['Enter the document number'],
      })
    })

    it('should skip validation if adding', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: '',
            identityValue: '',
          } as Form,
        ],
        add: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('should skip validation if removing', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: '',
            identityValue: '',
          } as Form,
        ],
        remove: '1',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('should skip validation if action is unknown', async () => {
      // Given
      const form = {
        identities: [
          {
            identityType: '',
            identityValue: '',
          } as Form,
        ],
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    const doValidate = async (form: { identities: Form[] }) => {
      const req = { body: form } as unknown as Request
      const schema = await identitiesSchema()(req)
      return schema.safeParse(form)
    }
  })
})
