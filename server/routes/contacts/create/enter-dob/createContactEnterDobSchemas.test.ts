import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { createContactEnterDobSchema } from './createContactEnterDobSchemas'

describe('createContactEnterDobSchema', () => {
  type Form = {
    isDobKnown?: string
    day?: string
    month?: string
    year?: string
  }
  describe('should validate the enter dob form', () => {
    it('should require isDobKnown', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({ isDobKnown: ['Select whether the date of birth is known'] })
    })
    it.each([
      ['true', true],
      ['false', false],
    ])('should map true or false to boolean for isDobKnown (%s, %s)', async (isDobKnown: string, expected: boolean) => {
      // Given
      const form = { isDobKnown, day: '1', month: '1', year: '1900' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data.isDobKnown).toStrictEqual(expected)
    })
    it('if dob is not known then do not require day, month and year', async () => {
      // Given
      const form = { isDobKnown: 'false' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({ isDobKnown: false })
    })

    it('if dob is known then require day, month and year', async () => {
      // Given
      const form = { isDobKnown: 'true' }

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
      const form = { isDobKnown: 'true', day: '', month: '', year: '' }

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
      const form = { isDobKnown: 'true', day: 'd', month: 'm', year: 'y' }

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
      const form = { isDobKnown: 'true', day, month: '1', year: '1999' }

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
      const form = { isDobKnown: 'true', day: '1', month, year: '1999' }

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
      const form = { isDobKnown: 'true', day: '1', month: '1', year }

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
      const form = { isDobKnown: 'true', day: '1', month: '1', year: '2045' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        isDobKnown: ['The date of birth must not be in the future'],
      })
    })
    it.each([
      ['01', '06', '1982', new Date('1982-06-01T00:00:00.000Z')],
      ['1', '6', '1982', new Date('1982-06-01T00:00:00.000Z')],
    ])('dob should parse to a date correctly', async (day: string, month: string, year: string, expected: Date) => {
      // Given
      const form = { isDobKnown: 'true', day, month, year }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        isDobKnown: true,
        dateOfBirth: expected,
      })
    })
    it('should not map dob if not known as we can select yes and enter day, month and year and then change to no so they may be populated in the form', async () => {
      // Given
      const form = { isDobKnown: 'false', day: '1', month: '1', year: '1900' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        isDobKnown: false,
      })
    })
    it('should handle empty/invalid dob fields if dob is not known', async () => {
      // Given
      const form = { isDobKnown: 'false', day: '', month: '', year: '' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        isDobKnown: false,
      })
    })
    const doValidate = async (form: Form) => {
      const schema = await createContactEnterDobSchema()()
      return schema.safeParse(form)
    }
  })
})
