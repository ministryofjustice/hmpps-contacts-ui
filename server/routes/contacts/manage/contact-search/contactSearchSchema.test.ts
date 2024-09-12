import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { contactSearchSchema } from './contactSearchSchema'

describe('contactSearchSchema', () => {
  describe('should validate the enter name form', () => {
    type Form = {
      lastName: string
      firstName: string
      middleName: string
    }
    const baseForm: Form = {
      lastName: '',
      firstName: '',
      middleName: '',
    }

    it('should require last name', async () => {
      // Given
      const form = { ...baseForm, firstName: 'first' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({ lastName: ["Enter the contact's last name"] })
    })

    it.each(['mum@example.com', "someone (don't know who)", 'Said £10 to tell me', '* look this up later', '911'])(
      'names should be limited to valid name chars',
      async (invalidName: string) => {
        // Given
        const form = {
          title: '',
          firstName: invalidName,
          middleName: invalidName,
          lastName: invalidName,
        }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({
          firstName: ["Contact's first name must not contain special characters"],
          lastName: ["Contact's last name must not contain special characters"],
          middleName: ["Contact's middle name must not contain special characters"],
        })
      },
    )

    it.each(['Foo jr.', 'Bar, the III', 'foo-bar', "Foo Mc'Bar", 'Foo Bar'])(
      'some special chars are valid in names',
      async (validName: string) => {
        // Given
        const form = {
          firstName: validName,
          middleName: validName,
          lastName: validName,
        }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(true)
      },
    )

    const doValidate = async (form: Form) => {
      const schema = await contactSearchSchema()()
      return schema.safeParse(form)
    }
  })

  describe('contactSearchSchema', () => {
    type Form = {
      firstName: string
      middleName?: string
      lastName?: string
      day?: string
      month?: string
      year?: string
    }
    describe('should validate the enter dob form', () => {
      it.each([
        ['', '', 'testname', '01', '06', '1982'],
        ['', '', 'testname', '1', '6', '1982'],
      ])(
        'dob should parse to a date correctly',
        async (firstName: string, middleName: string, lastName: string, day: string, month: string, year: string) => {
          // Given
          const form = { firstName, middleName, lastName, day, month, year }

          // When
          const result = await doValidate(form)

          // Then
          expect(result.success).toStrictEqual(true)
          expect(result.data).toStrictEqual({
            firstName: '',
            middleName: undefined,
            lastName: 'testname',
            day: 1,
            month: 6,
            year: 1982,
          })
        },
      )
    })

    const doValidate = async (form: Form) => {
      const schema = await contactSearchSchema()()
      return schema.safeParse(form)
    }
  })
})
