import captionForAddContactJourney from './addContactsUtils'

describe('addContactUtils', () => {
  describe('captionForAddContactJourney', () => {
    const baseJourney = {
      id: 'abc',
      lastTouched: new Date().toISOString(),
      prisonerNumber: 'A1234BC',
      isCheckingAnswers: false,
      returnPoint: { url: '/foo-bar' },
    }
    it('should return new caption if journey mode is new', () => {
      expect(captionForAddContactJourney({ ...baseJourney, mode: 'NEW' })).toStrictEqual(
        'Add a contact and link to a prisoner',
      )
    })
    it('should return default caption if journey mode is existing', () => {
      expect(captionForAddContactJourney({ ...baseJourney, mode: 'EXISTING' })).toStrictEqual(
        'Link a contact to a prisoner',
      )
    })
    it('should return default caption if journey mode is not set', () => {
      expect(captionForAddContactJourney({ ...baseJourney, mode: undefined })).toStrictEqual(
        'Link a contact to a prisoner',
      )
    })
  })
})
