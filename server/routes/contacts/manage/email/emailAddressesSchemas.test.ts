import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { emailSchema } from './emailSchemas'

describe('emailSchemaFactory', () => {
  type Form = {
    emailAddress: string
  }
  const baseForm: Form = {
    emailAddress: '',
  }
  describe('should validate a identity number form', () => {
    const EMAIL_REQUIRED_ERROR_MESSAGE = `Enter the contact’s email address`
    const EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE = `The contact’s email address should be 240 characters or fewer`
    const EMAIL_FORMAT_ERROR_MESSAGE = `Enter an email address in the correct format, like name@example.com`
    const invalidEmail = 'name@example'.padEnd(241, '0').concat('.com')

    it('should require email', async () => {
      // Given
      const form = { ...baseForm, emailAddress: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        emailAddress: [EMAIL_REQUIRED_ERROR_MESSAGE, EMAIL_FORMAT_ERROR_MESSAGE],
      })
    })

    it.each([
      ['name@', EMAIL_FORMAT_ERROR_MESSAGE],
      ['@example', EMAIL_FORMAT_ERROR_MESSAGE],
      ['@example.com', EMAIL_FORMAT_ERROR_MESSAGE],
      ['name_example.com', EMAIL_FORMAT_ERROR_MESSAGE],
      ['name_example.co%m', EMAIL_FORMAT_ERROR_MESSAGE],
      ['name@.com', EMAIL_FORMAT_ERROR_MESSAGE],
      ['*^$$@example.com', EMAIL_FORMAT_ERROR_MESSAGE],
      ['name@example.22com', EMAIL_FORMAT_ERROR_MESSAGE],
      [invalidEmail, EMAIL_NUMBER_OF_CHARACTERS_LIMIT_ERROR_MESSAGE],
    ])('should require a valid email', async (emailAddress: string, erroMessage: string) => {
      // Given
      const form = { ...baseForm, emailAddress }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ emailAddress: [erroMessage] })
    })

    const doValidate = async (form: Form) => {
      return emailSchema.safeParse(form)
    }
  })
})
