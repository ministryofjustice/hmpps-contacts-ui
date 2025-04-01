import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { contactSearchSchema } from './contactSearchSchema'

describe('contactSearchSchema', () => {
  describe('should validate the enter name form', () => {
    type Form = {
      lastName?: string
      firstName?: string
      middleNames?: string
      day?: string | undefined
      month?: string | undefined
      year?: string | undefined
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
      expect(result.data).toStrictEqual({
        firstName: '',
        middleNames: '',
        lastName: 'testname',
      })
    })

    it('should not pass validation when dob is not valid', async () => {
      // Given
      const form = { day: '32', month: '13', year: '100' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        year: ['Year must include 4 numbers'],
      })
    })

    it('should not pass validation when dob is in the future', async () => {
      // Given
      const date = new Date(Date.now())
      date.setDate(date.getDate() + 1)

      const form = {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        year: date.getFullYear().toString(),
      }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        day: ['Date of birth must be in the past'],
        month: [''],
        year: [''],
      })
    })

    const doValidate = async (form: Form) => {
      return contactSearchSchema.safeParse(form)
    }
  })

  describe('should validate the enter dob form', () => {
    type Form = {
      firstName?: string
      middleNames?: string
      lastName?: string
      day?: string
      month?: string
      year?: string
    }
    describe('should validate the enter dob form', () => {
      it.each([
        ['01', '06', '1982'],
        ['1', '6', '1982'],
      ])('dob should parse to a date correctly', async (day: string, month: string, year: string) => {
        // Given
        const form = { day, month, year }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(true)
        expect(result.data).toStrictEqual({
          day: 1,
          month: 6,
          year: 1982,
        })
      })

      it.each([
        ['13', '32', '1982'],
        ['32', '01', '1982'],
        ['13', '01', '2145'],
        ['01', '', ''],
        ['', '12', ''],
        ['', '', '1980'],
        ['13', '32', '198'],
        ['-13', '-01', '-1980'],
        ['30', '02', '1980'],
        ['29', '02', '2023'], // Feb had 28 in 2023
        ['29', '02', '1990'], // Feb had 28 in 1990
      ])('should not map dob', async (day: string, month: string, year: string) => {
        // Given
        const form = { day, month, year }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(false)
      })

      it.each([
        ['29', '02', '1980'], // Feb had 29 in 1980
      ])('should map it as a valid dob', async (day: string, month: string, year: string) => {
        // Given
        const form = { day, month, year }

        // When
        const result = await doValidate(form)

        // Then
        expect(result.success).toStrictEqual(true)
      })
    })

    const doValidate = async (form: Form) => {
      return contactSearchSchema.safeParse(form)
    }
  })
})
