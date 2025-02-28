import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { contactSearchSchema } from './contactSearchSchema'

describe('contactSearchSchema', () => {
  describe('should validate the enter name form', () => {
    type Form = {
      lastName: string
      firstName?: string
      middleNames?: string
      day?: number | undefined
      month?: number | undefined
      year?: number | undefined
    }
    const baseForm: Form = {
      lastName: '',
      firstName: '',
      middleNames: '',
      day: undefined,
      month: undefined,
      year: undefined,
    }

    it('should pass the validation when last name is entered', async () => {
      // Given
      const form = { ...baseForm, lastName: 'testname' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('should require last name', async () => {
      // Given
      const form = { ...baseForm, firstName: 'first' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({ lastName: ['Enter the contact’s last name'] })
    })

    it('should not pass validation when special characters are entered', async () => {
      // Given
      const form = { ...baseForm, firstName: '^%@!', middleNames: '^%@!', lastName: '^%@!' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        firstName: ['Contact’s first name must not contain special characters'],
        middleNames: ['Contact’s middle names must not contain special characters'],
        lastName: ['Contact’s last name must not contain special characters'],
      })
    })

    it('should not pass validation when dob is not valid', async () => {
      // Given
      const form = { ...baseForm, lastName: 'testname', day: 32, month: 13, year: 100 }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        day: ['Enter a valid day of the month (1-31)'],
        month: ['Enter a valid month (1-12)'],
        year: ['Enter a valid year. Must be at least 1900'],
        dob: ['The date of birth is invalid'],
      })
    })

    it('should not pass validation when dob is in the future', async () => {
      // Given
      const date = new Date(Date.now())
      date.setDate(date.getDate() + 1)

      const form = {
        ...baseForm,
        lastName: 'testname',
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        dob: ['The date of birth must not be in the future'],
      })
    })

    it.each(['mum@example.com', "someone (don't know who)", 'Said £10 to tell me', '* look this up later', '911'])(
      'names should be limited to valid name chars',
      async (invalidName: string) => {
        // Given
        const form = {
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
          firstName: [`Contact’s first name must not contain special characters`],
          lastName: [`Contact’s last name must not contain special characters`],
          middleNames: [`Contact’s middle names must not contain special characters`],
        })
      },
    )

    it.each(['Foo jr.', 'Bar, the III', 'foo-bar', "Foo Mc'Bar", 'Foo Bar'])(
      'some special chars are valid in names',
      async (validName: string) => {
        // Given
        const form = {
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
      const schema = await contactSearchSchema()()
      return schema.safeParse(form)
    }
  })

  describe('should validate the enter dob form', () => {
    type Form = {
      firstName: string
      middleNames?: string
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
        async (firstName: string, middleNames: string, lastName: string, day: string, month: string, year: string) => {
          // Given
          const form = { firstName, middleNames, lastName, day, month, year }

          // When
          const result = await doValidate(form)

          // Then
          expect(result.success).toStrictEqual(true)
          expect(result.data).toStrictEqual({
            firstName: '',
            middleNames: undefined,
            lastName: 'testname',
            day: 1,
            month: 6,
            year: 1982,
          })
        },
      )

      it.each([
        ['', '', 'testname', '13', '32', '1982'],
        ['', '', 'testname', '32', '01', '1982'],
        ['', '', 'testname', '13', '01', '2145'],
        ['', '', 'testname', '01', '', ''],
        ['', '', 'testname', '', '12', ''],
        ['', '', 'testname', '', '', '1980'],
        ['', '', 'testname', '13', '32', '198'],
        ['', '', 'testname', '-13', '-01', '-1980'],
        ['', '', 'testname', '30', '02', '1980'],
        ['', '', 'testname', '29', '02', '2023'], // Feb had 28 in 2023
        ['', '', 'testname', '29', '02', '1990'], // Feb had 28 in 1990
      ])(
        'should not map dob',
        async (firstName: string, middleNames: string, lastName: string, day: string, month: string, year: string) => {
          // Given
          const form = { firstName, middleNames, lastName, day, month, year }

          // When
          const result = await doValidate(form)

          // Then
          expect(result.success).toStrictEqual(false)
        },
      )

      it.each([
        ['', '', 'testname', '29', '02', '1980'], // Feb had 29 in 1980
      ])(
        'should map it as a valid dob',
        async (firstName: string, middleNames: string, lastName: string, day: string, month: string, year: string) => {
          // Given
          const form = { firstName, middleNames, lastName, day, month, year }

          // When
          const result = await doValidate(form)

          // Then
          expect(result.success).toStrictEqual(true)
        },
      )
    })

    const doValidate = async (form: Form) => {
      const schema = await contactSearchSchema()()
      return schema.safeParse(form)
    }
  })
})
