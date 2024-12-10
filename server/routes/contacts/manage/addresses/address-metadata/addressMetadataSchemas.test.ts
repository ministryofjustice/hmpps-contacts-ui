import { deduplicateFieldErrors } from '../../../../../middleware/validationMiddleware'
import { addressMetadataSchema } from './addressMetadataSchemas'

describe('addressMetadataSchema', () => {
  type Form = {
    fromMonth?: string
    fromYear?: string
    toMonth?: string
    toYear?: string
    primaryAddress?: string
    mailAddress?: string
    comments?: string
  }
  const baseForm: Form = {
    fromMonth: '',
    fromYear: '',
    toMonth: '',
    toYear: '',
    primaryAddress: '',
    mailAddress: '',
    comments: '',
  }
  describe('should validate an address metadata form', () => {
    it('Whole field is invalid if fromMonth and fromYear are missing ', async () => {
      // When
      const result = await doValidate(baseForm)

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        fromDate: ['Enter the date when the contact started using the address'],
      })
    })

    it('fromYear is invalid if only fromMonth is provided ', async () => {
      // When
      const result = await doValidate({ ...baseForm, fromMonth: '09' })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        fromYear: ['Start date must include a year'],
      })
    })

    it('fromMonth is invalid if only fromYear is provided ', async () => {
      // When
      const result = await doValidate({ ...baseForm, fromYear: '2009' })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        fromMonth: ['Start date must include a month'],
      })
    })

    it('fromMonth and fromYear must be numbers ', async () => {
      // When
      const result = await doValidate({ ...baseForm, fromMonth: 'XX', fromYear: 'YY' })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        fromMonth: ['Start month must be a real month'],
        fromYear: ['Start year must be a real year'],
      })
    })

    it('toYear is invalid if only toMonth is provided ', async () => {
      // When
      const result = await doValidate({ ...baseForm, fromMonth: '09', fromYear: '2009', toMonth: '05' })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        toYear: ['End date must include a year'],
      })
    })

    it('toMonth is invalid if only toYear is provided ', async () => {
      // When
      const result = await doValidate({ ...baseForm, fromMonth: '09', fromYear: '2009', toYear: '2005' })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        toMonth: ['End date must include a month'],
      })
    })

    it('toMonth and toYear must be numbers ', async () => {
      // When
      const result = await doValidate({ ...baseForm, fromMonth: '09', fromYear: '2009', toMonth: 'XX', toYear: 'YY' })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        toMonth: ['End month must be a real month'],
        toYear: ['End year must be a real year'],
      })
    })

    it('Comment must be less than 240', async () => {
      // When
      const result = await doValidate({ ...baseForm, fromMonth: '09', fromYear: '2009', comments: ''.padEnd(241, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result)
      expect(deduplicatedFieldErrors).toStrictEqual({
        comments: ['Address comment must be 240 characters or less'],
      })
    })

    const doValidate = async (form: Form) => {
      const schema = await addressMetadataSchema()()
      return schema.safeParse(form)
    }
  })
})