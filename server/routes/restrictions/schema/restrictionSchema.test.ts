import { Request } from 'express'
import { restrictionSchema } from './restrictionSchema'
import { deduplicateFieldErrors } from '../../../middleware/validationMiddleware'
import RestrictionClass = journeys.RestrictionClass

describe('restrictionSchema', () => {
  type Form = {
    type: string
    startDate: string
    expiryDate: string
    comments: string
  }
  const baseForm: Form = {
    type: '',
    startDate: '',
    expiryDate: '',
    comments: '',
  }
  describe('should validate the enter restriction form', () => {
    it.each([['CONTACT_GLOBAL'], ['PRISONER_CONTACT']])(
      'should require type for restriction class (%s)',
      async (restrictionClass: RestrictionClass) => {
        // Given
        const form = { ...baseForm, startDate: '15/06/1982' }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({ type: ['Select the restriction type'] })
      },
    )

    it.each([['CONTACT_GLOBAL'], ['PRISONER_CONTACT']])(
      'should require start date for restriction class (%s)',
      async (restrictionClass: RestrictionClass) => {
        // Given
        const form = { ...baseForm, type: 'BAN' }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({ startDate: ['Enter the start date for the restriction'] })
      },
    )

    const invalidDateCases = [
      ['CONTACT_GLOBAL', 'abc'],
      ['PRISONER_CONTACT', 'abc'],
      ['CONTACT_GLOBAL', '2020-01-01'],
      ['PRISONER_CONTACT', '2020-01-01'],
      ['CONTACT_GLOBAL', '31/2/2024'],
      ['PRISONER_CONTACT', '31/2/2024'],
    ]

    const expiryDateBeforeStartDateCases = [
      ['CONTACT_GLOBAL', '2/12/2024', '1/12/2024'],
      ['PRISONER_CONTACT', '2/12/2024', '1/12/2024'],
    ]

    it.each(invalidDateCases)(
      'start date should be a valid date for restriction class (%s)',
      async (restrictionClass: RestrictionClass, startDate: string) => {
        // Given
        const form = { ...baseForm, type: 'BAN', startDate }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({ startDate: ['Start date must be a real date'] })
      },
    )

    it.each(invalidDateCases)(
      'expiry date should be a valid date, if provided, for restriction class (%s)',
      async (restrictionClass: RestrictionClass, expiryDate: string) => {
        // Given
        const form = { ...baseForm, type: 'BAN', startDate: '1/2/2024', expiryDate }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({ expiryDate: ['Expiry date must be a real date'] })
      },
    )

    it.each(expiryDateBeforeStartDateCases)(
      'expiry date should be same as or after the start date, if provided, for restriction class (%s)',
      async (restrictionClass: RestrictionClass, startDate: string, expiryDate: string) => {
        // Given
        const form = { ...baseForm, type: 'BAN', startDate, expiryDate }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({
          expiryDate: ['End date must be the same as or after the start date December 2024'],
        })
      },
    )

    it.each([
      ['CONTACT_GLOBAL', 240],
      ['PRISONER_CONTACT', 255],
    ])(
      'should require comments for restriction class (%s) to be less than (%s)',
      async (restrictionClass: RestrictionClass, maxLength: number) => {
        // Given
        const form = { ...baseForm, type: 'BAN', startDate: '1/2/2024', comments: ''.padEnd(maxLength + 1) }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(false)
        const deduplicatedFieldErrors = deduplicateFieldErrors(result)
        expect(deduplicatedFieldErrors).toStrictEqual({ comments: [`Comment must be ${maxLength} characters or less`] })
      },
    )

    it.each([['CONTACT_GLOBAL'], ['PRISONER_CONTACT']])(
      'should parse with minimal fields successfully for restriction class (%s)',
      async (restrictionClass: RestrictionClass) => {
        // Given
        const form = { ...baseForm, type: 'BAN', startDate: '1/2/2024' }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(true)
        expect(result.data).toStrictEqual({
          type: 'BAN',
          startDate: '1/2/2024',
          expiryDate: undefined,
          comments: undefined,
        })
      },
    )

    it.each([['CONTACT_GLOBAL'], ['PRISONER_CONTACT']])(
      'should parse with all fields successfully for restriction class (%s)',
      async (restrictionClass: RestrictionClass) => {
        // Given
        const form = {
          ...baseForm,
          type: 'BAN',
          startDate: '1/2/2024',
          expiryDate: '1/2/2025',
          comments: 'Some comments',
        }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(true)
        expect(result.data).toStrictEqual({
          type: 'BAN',
          startDate: '1/2/2024',
          expiryDate: '1/2/2025',
          comments: 'Some comments',
        })
      },
    )

    it.each([['CONTACT_GLOBAL'], ['PRISONER_CONTACT']])(
      'should parse with all fields successfully for expiry date is same as start date (%s)',
      async (restrictionClass: RestrictionClass) => {
        // Given
        const form = {
          ...baseForm,
          type: 'BAN',
          startDate: '1/2/2025',
          expiryDate: '1/2/2025',
          comments: 'Some comments',
        }

        // When
        const result = await doValidate(form, restrictionClass)

        // Then
        expect(result.success).toStrictEqual(true)
        expect(result.data).toStrictEqual({
          type: 'BAN',
          startDate: '1/2/2025',
          expiryDate: '1/2/2025',
          comments: 'Some comments',
        })
      },
    )

    const doValidate = async (form: Form, restrictionClass: RestrictionClass) => {
      const req = {
        params: { restrictionClass },
      } as unknown as Request

      const schema = await restrictionSchema()(req)
      return schema.safeParse(form)
    }
  })
})
