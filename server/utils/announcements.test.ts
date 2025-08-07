import { getAnnouncement } from './announcement'

describe('announcement', () => {
  const OLD_ENV = process.env
  const INFO_TEXT = `Your ability to manage prisoner contacts on DPS is currently limited.</br>
All establishments will have full access to the new prisoner Contacts service from October. To request early access, ask your Head of Operations or another appropriate staff member to email
<a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>.

<div class="govuk-notification-banner__content govuk-!-padding-left-0">
  <details class="govuk-details">
    <summary class="govuk-details__summary">
      <span class="govuk-details__summary-text">Where is this data from?</span>
    </summary>
    <div class="govuk-details__text">
      This data has been copied over from NOMIS. If any of the information needs to be changed, you should make the changes in NOMIS.
    </div>
  </details>
</div>`

  beforeEach(() => {
    jest.resetModules() // This clears the cache
    process.env = { ...OLD_ENV } // Make a copy
  })

  afterAll(() => {
    process.env = OLD_ENV // Restore old environment
  })

  describe('getAnnouncement', () => {
    it('should return undefined for prisons in FEATURE_ENABLED_PRISONS', () => {
      // Arrange
      process.env['FEATURE_ENABLED_PRISONS'] = 'KMI,GNI,SPI,LGI,DWI,HOI,WWI'

      // Act & Assert
      expect(getAnnouncement('KMI')).toBeUndefined()
      expect(getAnnouncement('GNI')).toBeUndefined()
      expect(getAnnouncement('SPI')).toBeUndefined()
      expect(getAnnouncement('LGI')).toBeUndefined()
      expect(getAnnouncement('DWI')).toBeUndefined()
      expect(getAnnouncement('HOI')).toBeUndefined()
      expect(getAnnouncement('WWI')).toBeUndefined()
    })

    it('should return announcement for prisons not in FEATURE_ENABLED_PRISONS', () => {
      // Arrange
      process.env['FEATURE_ENABLED_PRISONS'] = 'KMI,GNI,SPI'
      const expectedAnnouncement = {
        title: 'You have limited access to the new Contacts service on DPS',
        html: expect.stringContaining(INFO_TEXT),
      }

      // Act & Assert
      expect(getAnnouncement('MDI')).toMatchObject(expectedAnnouncement)
      expect(getAnnouncement('XXX')).toMatchObject(expectedAnnouncement)
    })

    it('should return announcement when FEATURE_ENABLED_PRISONS is not set', () => {
      // Arrange
      delete process.env['FEATURE_ENABLED_PRISONS']
      const expectedAnnouncement = {
        title: 'You have limited access to the new Contacts service on DPS',
        html: expect.stringContaining(INFO_TEXT),
      }

      // Act & Assert
      expect(getAnnouncement('ANY_PRISON')).toMatchObject(expectedAnnouncement)
    })

    it('should return announcement for empty prison code', () => {
      // Arrange
      process.env['FEATURE_ENABLED_PRISONS'] = 'KMI,GNI,SPI'
      const expectedAnnouncement = {
        title: 'You have limited access to the new Contacts service on DPS',
        html: expect.stringContaining(INFO_TEXT),
      }

      // Act & Assert
      expect(getAnnouncement('')).toMatchObject(expectedAnnouncement)
    })

    it('should handle whitespace in FEATURE_ENABLED_PRISONS', () => {
      // Arrange
      process.env['FEATURE_ENABLED_PRISONS'] = '  KMI , GNI ,  SPI  '

      // Act & Assert
      expect(getAnnouncement('KMI')).toBeUndefined()
      expect(getAnnouncement('GNI')).toBeUndefined()
      expect(getAnnouncement('SPI')).toBeUndefined()
      expect(getAnnouncement('MDI')).toMatchObject({
        title: 'You have limited access to the new Contacts service on DPS',
        html: expect.stringContaining(INFO_TEXT),
      })
    })
  })
})
