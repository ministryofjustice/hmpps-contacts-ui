import { fullNameSchema } from './nameSchemas'
import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'

describe('createContactEnterNameSchema', () => {
  type Form = {
    title: string
    lastName: string
    firstName: string
    middleNames: string
  }
  const baseForm: Form = {
    title: '',
    lastName: '',
    firstName: '',
    middleNames: '',
  }
  describe('should validate the enter name form', () => {
    it('should require last name', async () => {
      // Given
      const form = { ...baseForm, firstName: 'first' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ lastName: ["Enter the contact's last name"] })
    })

    it('should require first name', async () => {
      // Given
      const form = { ...baseForm, lastName: 'last' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ firstName: ["Enter the contact's first name"] })
    })

    it('names should be limited to 35 chars', async () => {
      // Given
      const nameThatIs35Chars = ''.padEnd(36, 'x')
      const form = {
        title: '',
        firstName: nameThatIs35Chars,
        middleNames: nameThatIs35Chars,
        lastName: nameThatIs35Chars,
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        firstName: ["Contact's first name must be 35 characters or less"],
        lastName: ["Contact's last name must be 35 characters or less"],
        middleNames: ["Contact's middle names must be 35 characters or less"],
      })
    })

    it("whitespace shouldn't count for minimum name length", async () => {
      // Given
      const form = {
        ...baseForm,
        firstName: '  ',
        lastName: '  ',
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        firstName: ["Enter the contact's first name"],
        lastName: ["Enter the contact's last name"],
      })
    })

    it.each(['mum@example.com', "someone (don't know who)", 'Said £10 to tell me', '* look this up later', '911'])(
      'names should be limited to valid name chars',
      async (invalidName: string) => {
        // Given
        const form = {
          title: '',
          firstName: invalidName,
          middleNames: invalidName,
          lastName: invalidName,
        }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
        expect(deduplicatedFieldErrors).toStrictEqual({
          firstName: ["Contact's first name must not contain special characters"],
          lastName: ["Contact's last name must not contain special characters"],
          middleNames: ["Contact's middle names must not contain special characters"],
        })
      },
    )

    it.each(['Foo jr.', 'Bar, the III', 'foo-bar', "Foo Mc'Bar", 'Foo Bar'])(
      'some special chars are valid in names',
      async (validName: string) => {
        // Given
        const form = {
          title: '',
          firstName: validName,
          middleNames: validName,
          lastName: validName,
        }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(true)
      },
    )

    const doValidate = async (form: Form) => {
      const schema = await fullNameSchema()()
      return schema.safeParse(form)
    }
  })
})
