import { contactSearchSchema } from './contactSearchSchema'

describe('contactSearchSchema', () => {
  describe('ID search', () => {
    it('passes with valid contactId and no DOB', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'ID',
        contactId: 'ABC123',
      })
      expect(result.success).toBe(true)
    })

    it('fails when contactId missing', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'ID',
        contactId: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message)
        expect(messages).toContain('Contact ID is required when searching by ID')
      }
    })

    it('validates DOB when provided', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'ID',
        contactId: 'ABC123',
        day: '01',
        month: '01',
        year: '2000',
      })
      expect(result.success).toBe(true)
    })

    it('fails with invalid DOB when provided', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'ID',
        contactId: 'ABC123',
        day: '31',
        month: '02',
        year: '2000',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('NAME search', () => {
    it('passes with lastName and no DOB', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'NAME',
        lastName: 'Smith',
      })
      expect(result.success).toBe(true)
    })

    it('fails when lastName missing', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'NAME',
        lastName: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message)
        expect(messages).toContain('Last Name is required when searching by contact name')
      }
    })

    it('validates DOB when provided', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'NAME',
        lastName: 'Smith',
        day: '15',
        month: '06',
        year: '1990',
      })
      expect(result.success).toBe(true)
    })

    it('fails with invalid DOB when provided', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'NAME',
        lastName: 'Smith',
        day: '00',
        month: '13',
        year: '1990',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('FILTER search', () => {
    it('fails when DOB not provided', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'FILTER',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message)
        expect(messages).toContain('Enter the date of birth')
      }
    })

    it('fails when DOB incomplete', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'FILTER',
        day: '10',
        month: '',
        year: '1980',
      })
      expect(result.success).toBe(false)
    })

    it('passes when DOB valid', () => {
      const result = contactSearchSchema.safeParse({
        searchType: 'FILTER',
        day: '10',
        month: '12',
        year: '1980',
      })
      expect(result.success).toBe(true)
    })
  })
})
