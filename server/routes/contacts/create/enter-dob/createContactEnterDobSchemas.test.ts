import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { createContactEnterDobSchema } from './createContactEnterDobSchemas'

describe('createContactEnterDobSchema', () => {
  type Form = {
    isKnown?: string
    day?: string
    month?: string
    year?: string
  }
  describe('should validate the enter dob form', () => {
    it('should require isKnown', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({ isKnown: ['Select whether the date of birth is known'] })
    })
    it.each([
      ['Yes', 'Yes'],
      ['No', 'No'],
    ])('should map Yes or No for isKnown (%s, %s)', async (isKnown: string, expected: string) => {
      // Given
      const form = { isKnown, day: '1', month: '1', year: '1900' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data.isKnown).toStrictEqual(expected)
    })

    it('if dob is not known then do not require day, month and year', async () => {
      // Given
      const form = { isKnown: 'No' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({ isKnown: 'No' })
    })

    it('if dob is known then require day, month and year', async () => {
      // Given
      const form = { isKnown: 'Yes' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        day: ['Enter a valid day of the month (1-31)'],
        month: ['Enter a valid month (1-12)'],
        year: ['Enter a valid year. Must be at least 1900'],
      })
    })
    it('if dob is known then require day, month and year not be empty', async () => {
      // Given
      const form = { isKnown: 'Yes', day: '', month: '', year: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        day: ['Enter a valid day of the month (1-31)'],
        month: ['Enter a valid month (1-12)'],
        year: ['Enter a valid year. Must be at least 1900'],
      })
    })

    it('if dob is known then require day, month and year be numbers', async () => {
      // Given
      const form = { isKnown: 'Yes', day: 'd', month: 'm', year: 'y' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        day: ['Enter a valid day of the month (1-31)'],
        month: ['Enter a valid month (1-12)'],
        year: ['Enter a valid year. Must be at least 1900'],
      })
    })

    it.each([
      ['0', false],
      ['-1', false],
      ['32', false],
      ['1', true],
      ['31', true],
    ])('if dob is known then day must be in range of 1-31 (%s, %s)', async (day: string, isValid: boolean) => {
      // Given
      const form = { isKnown: 'Yes', day, month: '1', year: '1999' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(isValid)
      if (!isValid) {
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({
          day: ['Enter a valid day of the month (1-31)'],
        })
      }
    })

    it.each([
      ['0', false],
      ['-1', false],
      ['13', false],
      ['1', true],
      ['12', true],
    ])('if dob is known then month must be in range of 1-12 (%s, %s)', async (month: string, isValid: boolean) => {
      // Given
      const form = { isKnown: 'Yes', day: '1', month, year: '1999' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(isValid)
      if (!isValid) {
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({
          month: ['Enter a valid month (1-12)'],
        })
      }
    })

    it.each([
      ['0', false],
      ['-1', false],
      ['1899', false],
      ['1900', true],
    ])('if dob is known then year must be at least 1900 (%s, %s)', async (year: string, isValid: boolean) => {
      // Given
      const form = { isKnown: 'Yes', day: '1', month: '1', year }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(isValid)
      if (!isValid) {
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({
          year: ['Enter a valid year. Must be at least 1900'],
        })
      }
    })

    it('dob must not be in the future', async () => {
      // Given
      const form = { isKnown: 'Yes', day: '1', month: '1', year: '2045' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        isKnown: ['The date of birth must not be in the future'],
      })
    })
    it.each([
      ['01', '06', '1982'],
      ['1', '6', '1982'],
    ])('dob should parse to a date correctly', async (day: string, month: string, year: string) => {
      // Given
      const form = { isKnown: 'Yes', day, month, year }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        isKnown: 'Yes',
        day: 1,
        month: 6,
        year: 1982,
      })
    })
    it('should not map dob if not known as we can select yes and enter day, month and year and then change to no so they may be populated in the form', async () => {
      // Given
      const form = { isKnown: 'No', day: '1', month: '1', year: '1900' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        isKnown: 'No',
      })
    })

    it('should handle empty/invalid dob fields if dob is not known', async () => {
      // Given
      const form = { isKnown: 'No', day: '', month: '', year: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        isKnown: 'No',
      })
    })

    const doValidate = async (form: Form) => {
      const schema = await createContactEnterDobSchema()()
      return schema.safeParse(form)
    }
  })
})
