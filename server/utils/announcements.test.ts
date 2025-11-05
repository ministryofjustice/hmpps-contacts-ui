import { getAnnouncement } from './announcement'

describe('announcement', () => {
  const OLD_ENV = process.env
  const NOMIS_OFF_PILOT_ANNOUNCEMENT = {
    title: 'You must use DPS to manage contacts in your prison',
    html: `The equivalent NOMIS functionality has now been switched-off. You can access guidance and demo videos on <br/>our <a class="govuk-notification-sharepoint__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C" target="_blank" rel="noopener noreferrer">SharePoint site</a>. If you have any questions or feedback, email 
<a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>.`,
  }

  const DEFAULT_ANNOUNCEMENT = {
    title: 'Your prison has the new Contacts service in DPS.',
    html: `You can access guidance and demo videos on our <a class="govuk-notification-sharepoint__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C" target="_blank" rel="noopener noreferrer">SharePoint site</a>. If you think you need a different role, speak to your LSA. The equivalent NOMIS functionality will be disabled in the coming months with read-only access. If you have any questions, contact <a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>`,
  }
  beforeEach(() => {
    jest.resetModules() // This clears the cache
    process.env = { ...OLD_ENV } // Make a copy
  })

  afterAll(() => {
    process.env = OLD_ENV // Restore old environment
  })

  describe('getAnnouncement', () => {
    it('should return announcement for prisons in FEATURE_NOMIS_SCREENS_OFF_PRISONS', () => {
      // Arrange
      process.env['FEATURE_NOMIS_SCREENS_OFF_PRISONS'] = 'KMI,GNI,SPI'

      // Act & Assert
      expect(getAnnouncement('KMI')).toMatchObject(NOMIS_OFF_PILOT_ANNOUNCEMENT)
    })

    it('should return announcement for prisons not in FEATURE_NOMIS_SCREENS_OFF_PRISONS', () => {
      // Arrange
      process.env['FEATURE_NOMIS_SCREENS_OFF_PRISONS'] = 'KMI,GNI,SPI'

      // Act & Assert
      expect(getAnnouncement('XXX')).toMatchObject(DEFAULT_ANNOUNCEMENT)
    })
  })
})
