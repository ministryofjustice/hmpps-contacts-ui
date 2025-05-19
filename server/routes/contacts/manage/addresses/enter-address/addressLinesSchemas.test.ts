import { deduplicateFieldErrors } from '../../../../../middleware/validationMiddleware'
import { addressLinesSchema } from './addressLinesSchemas'

describe('addressLinesSchemas', () => {
  type Form = {
    noFixedAddress?: string
    flat?: string
    property?: string
    street?: string
    area?: string
    cityCode?: string
    countyCode?: string
    postcode?: string
    countryCode?: string
  }
  describe('should validate a address lines form', () => {
    it('should require countryCode', async () => {
      // When
      const result = await doValidate({})

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        countryCode: ['Select a country'],
      })
    })

    it('flat max length', async () => {
      // When
      const result = await doValidate({ countryCode: 'ENG', flat: ''.padEnd(31, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        flat: ['Flat or building unit must be 30 characters or less'],
      })
    })

    it('property max length', async () => {
      // When
      const result = await doValidate({ countryCode: 'ENG', property: ''.padEnd(51, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        property: ['Building name must be 50 characters or less'],
      })
    })

    it('street max length', async () => {
      // When
      const result = await doValidate({ countryCode: 'ENG', street: ''.padEnd(161, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        street: ['Street number and name must be 160 characters or less'],
      })
    })

    it('area max length', async () => {
      // When
      const result = await doValidate({ countryCode: 'ENG', area: ''.padEnd(71, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        area: ['District or locality must be 70 characters or less'],
      })
    })

    it('postcode max length', async () => {
      // When
      const result = await doValidate({ countryCode: 'ENG', postcode: ''.padEnd(13, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        postcode: ['Postcode must be 12 characters or less'],
      })
    })

    it('accepts fields at boundary length', async () => {
      // When
      const result = await doValidate({
        countryCode: 'ENG',
        flat: ''.padEnd(30, 'X'),
        property: ''.padEnd(50, 'X'),
        street: ''.padEnd(160, 'X'),
        area: ''.padEnd(70, 'X'),
        postcode: ''.padEnd(12, 'X'),
      })

      // Then
      expect(result.success).toStrictEqual(true)
    })

    it('optional fields are undefined', async () => {
      // When
      const result = await doValidate({
        noFixedAddress: '',
        flat: '',
        property: '',
        street: '',
        area: '',
        cityCode: '',
        countyCode: '',
        postcode: '',
        countryCode: 'ENG',
      })

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        noFixedAddress: undefined,
        flat: undefined,
        property: undefined,
        street: undefined,
        area: undefined,
        cityCode: undefined,
        countyCode: undefined,
        postcode: undefined,
        countryCode: 'ENG',
      })
    })

    const doValidate = async (form: Form) => {
      return addressLinesSchema.safeParse(form)
    }
  })
})
