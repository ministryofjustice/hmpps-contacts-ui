import { deduplicateFieldErrors } from '../../../../middleware/validationMiddleware'
import { dateOfDeathSchema } from './manageContactDateOfDeathSchema'

describe('dateOfDeathSchema', () => {
  type Form = {
    day?: string
    month?: string
    year?: string
  }
  describe('should validate the enter date of death form', () => {
    it('Should return top level error with dateOfDeath id and description for empty inputs', async () => {
      // Given
      const form = {}

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        dateOfDeath: ['Enter the date of death'],
      })
    })

    it('Should allow valid date in the past', async () => {
      // Given
      const form = { day: '1', month: '12', year: '1999' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('Should return a single error if date of death is in the future', async () => {
      // Given
      const form = { day: '1', month: '12', year: '2045' }

      // When
      const result = await doValidate(form)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        day: ['Date of death must be today or in the past'],
        month: [''],
        year: [''],
      })
    })

    const doValidate = async (form: Form) => {
      return dateOfDeathSchema.safeParse(form)
    }
  })
})
