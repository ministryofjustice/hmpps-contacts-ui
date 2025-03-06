import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { emailSchema } from './emailSchemas'

describe('emailSchemaFactory', () => {
  type Form = {
    emailAddress: string
  }
  const baseForm: Form = {
    emailAddress: '',
  }
  describe('should validate a email address form', () => {
    it('should require email', async () => {
      // Given
      const form = { ...baseForm, emailAddress: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        emailAddress: ['Enter an email address'],
      })
    })

    it('should limit to 240 characters', async () => {
      // Given
      const form = { ...baseForm, emailAddress: 'name@example.com'.padStart(241, 'x') }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        emailAddress: ['Email address must be 240 characters or less'],
      })
    })

    it.each([['name@'], ['@example'], ['@example.com'], ['name_example.com'], ['name_example.co%m'], ['name@.com']])(
      'should require a valid email (%s)',
      async (emailAddress: string) => {
        // Given
        const form = { ...baseForm, emailAddress }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
        expect(deduplicatedFieldErrors).toStrictEqual({
          emailAddress: ['Enter an email address in the correct format, like name@example.com'],
        })
      },
    )

    it.each(['name@example.com', 'name@EXAMPLE.com'])(
      'should prevent duplicates case insensitive',
      async emailAddress => {
        // Given
        const form = { ...baseForm, emailAddress, otherEmailAddresses: ['name@example.com'] }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
        expect(deduplicatedFieldErrors).toStrictEqual({
          emailAddress: [`Email address ‘${emailAddress}’ has already been entered for this contact`],
        })
      },
    )

    it('should drop other emails in success data', async () => {
      // Given
      const form = { ...baseForm, emailAddress: 'test@example.com', otherEmailAddresses: ['name@example.com'] }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        emailAddress: 'test@example.com',
      })
    })

    const doValidate = async (form: Form) => {
      return emailSchema.safeParse(form)
    }
  })
})
