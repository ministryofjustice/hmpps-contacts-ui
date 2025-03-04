import { Request } from 'express'
import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { identitiesSchema, identitySchema } from './IdentitySchemas'

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
      expect(deduplicatedFieldErrors).toStrictEqual({ type: ['Select the document type'] })
    })

    it('should require identity number', async () => {
      // Given
      const form = { ...baseForm, type: 'PASS' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ identity: ['Enter the document number'] })
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
        identity: ['Document number must be 20 characters or less'],
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
        issuingAuthority: ['Issuing authority must be 40 characters or less'],
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
      expect(deduplicatedFieldErrors).toStrictEqual({
        identity: ['Enter a PNC number in the correct format – for example, ‘22/1234567A’'],
      })
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
          type: ['Select the document type'],
          identity: ['Enter the document number'],
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
            type: '',
            identity: '132',
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)

      expect(deduplicatedFieldErrors).toStrictEqual({ 'identities[0].type': ['Select the document type'] })
    })

    it('should require identity number', async () => {
      // Given
      const form = {
        identities: [
          {
            type: 'DL',
            identity: '',
          } as Form,
        ],
        save: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ 'identities[0].identity': ['Enter the document number'] })
    })

    it('identity number should be limited to 20 chars', async () => {
      // Given
      const form = {
        identities: [
          {
            type: 'DL',
            identity: ''.padEnd(21, '1'),
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
        'identities[0].identity': ['Document number must be 20 characters or less'],
      })
    })

    it('issuing authority should be limited to 40 chars', async () => {
      // Given
      const form = {
        identities: [
          {
            type: 'PASS',
            identity: 'LAST-87736799M',
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
            type: 'PNC',
            identity: '1923/1Z34567A',
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
        'identities[0].identity': ['Enter a PNC number in the correct format – for example, ‘22/1234567A’'],
      })
    })

    it('should accept PNC numbers in required format', async () => {
      // Given
      const form = {
        identities: [
          {
            type: 'PNC',
            identity: '2008/0056560Z',
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
            type: 'PASS',
            identity: 'LAST-87736799M',
            issuingAuthority: ''.padEnd(41, '1'),
          } as Form,
          {
            type: '',
            identity: 'LAST-87736799M',
          } as Form,
          {
            type: 'DL',
            identity: '',
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
        'identities[1].type': ['Select the document type'],
        'identities[2].identity': ['Enter the document number'],
      })
    })

    it('should skip validation if adding', async () => {
      // Given
      const form = {
        identities: [
          {
            type: '',
            identity: '',
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
            type: '',
            identity: '',
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
            type: '',
            identity: '',
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
