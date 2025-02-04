import { deduplicateFieldErrors } from '../../../../../middleware/validationMiddleware'
import { addressLinesSchema } from './addressLinesSchemas'

describe('addressLinesSchemas', () => {
  type Form = {
    noFixedAddress?: string
    flat?: string
    premises?: string
    street?: string
    locality?: string
    town?: string
    county?: string
    postcode?: string
    country?: string
  }
  describe('should validate a address lines form', () => {
    it('should require country', async () => {
      // When
      const result = await doValidate({})

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        country: ['Select a country'],
      })
    })

    it('flat max length', async () => {
      // When
      const result = await doValidate({ country: 'ENG', flat: ''.padEnd(31, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        flat: ['Flat must be 30 characters or less'],
      })
    })

    it('premises max length', async () => {
      // When
      const result = await doValidate({ country: 'ENG', premises: ''.padEnd(51, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        premises: ['Premises must be 50 characters or less'],
      })
    })

    it('street max length', async () => {
      // When
      const result = await doValidate({ country: 'ENG', street: ''.padEnd(161, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        street: ['Street must be 160 characters or less'],
      })
    })

    it('locality max length', async () => {
      // When
      const result = await doValidate({ country: 'ENG', locality: ''.padEnd(71, 'X') })

      // Then
      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual({
        locality: ['Locality must be 70 characters or less'],
      })
    })

    it('postcode max length', async () => {
      // When
      const result = await doValidate({ country: 'ENG', postcode: ''.padEnd(13, 'X') })

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
        country: 'ENG',
        flat: ''.padEnd(30, 'X'),
        premises: ''.padEnd(50, 'X'),
        street: ''.padEnd(160, 'X'),
        locality: ''.padEnd(70, 'X'),
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
        premises: '',
        street: '',
        locality: '',
        town: '',
        county: '',
        postcode: '',
        country: 'ENG',
      })

      // Then
      expect(result.success).toStrictEqual(true)
      expect(result.data).toStrictEqual({
        noFixedAddress: undefined,
        flat: undefined,
        premises: undefined,
        street: undefined,
        locality: undefined,
        town: undefined,
        county: undefined,
        postcode: undefined,
        country: 'ENG',
      })
    })

    const doValidate = async (form: Form) => {
      return addressLinesSchema.safeParse(form)
    }
  })
})
