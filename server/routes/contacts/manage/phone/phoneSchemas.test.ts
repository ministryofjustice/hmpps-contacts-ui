import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { phoneNumberSchema } from './phoneSchemas'

describe('phoneNumberSchemaFactory', () => {
  type Form = {
    type: string
    phoneNumber: string
    extension: string
  }
  const baseForm: Form = {
    type: '',
    phoneNumber: '',
    extension: '',
  }
  describe('should validate a phone number form', () => {
    it('should require type', async () => {
      // Given
      const form = { ...baseForm, phoneNumber: '123456' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ type: ['Select the type of phone number'] })
    })

    it('should require phone number', async () => {
      // Given
      const form = { ...baseForm, type: 'MOB' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ phoneNumber: ['Enter a phone number'] })
    })

    it('phone number should be limited to 20 chars', async () => {
      // Given
      const form = {
        type: 'MOB',
        phoneNumber: ''.padEnd(21, '1'),
        extension: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        phoneNumber: ['Phone number must be 20 characters or less'],
      })
    })

    it('extension should be limited to 7 chars', async () => {
      // Given
      const form = {
        type: 'MOB',
        phoneNumber: '0123456789',
        extension: ''.padEnd(8, '1'),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        extension: ['Extension must be 7 characters or less'],
      })
    })

    it('phone number should allow a plus at the start and brackets', async () => {
      // Given
      const form = {
        type: 'MOB',
        phoneNumber: '+(44) 999',
        extension: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it.each([
      ['plus not at start', '99+'],
      ['letters', '012345 ABC'],
      ['other chars', '#'],
    ])('phone number not allowed %s (%s)', async (_: string, phoneNumber: string) => {
      // Given
      const form = {
        type: 'MOB',
        phoneNumber,
        extension: '',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        phoneNumber: ['Enter a phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192'],
      })
    })

    it('should present errors in field order', async () => {
      // Given
      const form = {
        type: '',
        phoneNumber: '',
        extension: ''.padEnd(8, '1'),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(JSON.stringify(deduplicatedFieldErrors)).toBe(
        JSON.stringify({
          type: ['Select the type of phone number'],
          phoneNumber: ['Enter a phone number'],
          extension: ['Extension must be 7 characters or less'],
        }),
      )
    })

    const doValidate = async (form: Form) => {
      return phoneNumberSchema.safeParse(form)
    }
  })
})
