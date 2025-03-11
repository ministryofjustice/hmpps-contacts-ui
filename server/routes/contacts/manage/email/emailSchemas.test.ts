import { Request } from 'express'
import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { emailSchema, emailsSchema } from './emailSchemas'

describe('emailSchema', () => {
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
describe('emailsSchema', () => {
  type Form = {
    emails: { emailAddress: string }[]
    save?: string | undefined
    remove?: string | undefined
    add?: string | undefined
  }
  describe('should validate a email address form', () => {
    it('should require email', async () => {
      // Given
      const form = { emails: [{ emailAddress: '' }], save: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        'emails[0].emailAddress': ['Enter an email address'],
      })
    })

    it('should limit to 240 characters', async () => {
      // Given
      const form = { emails: [{ emailAddress: 'name@example.com'.padStart(241, 'x') }], save: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        'emails[0].emailAddress': ['Email address must be 240 characters or less'],
      })
    })

    it.each([['name@'], ['@example'], ['@example.com'], ['name_example.com'], ['name_example.co%m'], ['name@.com']])(
      'should require a valid email (%s)',
      async (emailAddress: string) => {
        // Given
        const form = { emails: [{ emailAddress }], save: '' }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
        expect(deduplicatedFieldErrors).toStrictEqual({
          'emails[0].emailAddress': ['Enter an email address in the correct format, like name@example.com'],
        })
      },
    )

    it.each(['name@example.com', 'name@EXAMPLE.com'])(
      'should prevent duplicates case insensitive',
      async emailAddress => {
        // Given
        const form = { emails: [{ emailAddress }], otherEmailAddresses: ['name@example.com'], save: '' }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
        expect(deduplicatedFieldErrors).toStrictEqual({
          'emails[0].emailAddress': [`Email address ‘${emailAddress}’ has already been entered for this contact`],
        })
      },
    )

    it('should validate all emails', async () => {
      // Given
      const form = { emails: [{ emailAddress: '' }, { emailAddress: 'invalidemail' }], save: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        'emails[0].emailAddress': ['Enter an email address'],
        'emails[1].emailAddress': ['Enter an email address in the correct format, like name@example.com'],
      })
    })

    it('should skip validate on add', async () => {
      // Given
      const form = { emails: [{ emailAddress: '' }, { emailAddress: 'invalidemail' }], add: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })
    it('should skip validate on remove', async () => {
      // Given
      const form = { emails: [{ emailAddress: '' }, { emailAddress: 'invalidemail' }], remove: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('should skip validate on no action', async () => {
      // Given
      const form = { emails: [{ emailAddress: '' }, { emailAddress: 'invalidemail' }] }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    const doValidate = async (form: Form) => {
      const req = { body: form } as unknown as Request
      const schema = await emailsSchema()(req)
      return schema.safeParse(form)
    }
  })
})
