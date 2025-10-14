import { getAnnouncement } from './announcement'

describe('announcement', () => {
  beforeEach(() => {
    jest.resetModules() // This clears the cache
  })

  describe('getAnnouncement', () => {
    it('should return announcement', () => {
      // Arrange
      const expectedAnnouncement = {
        title: 'Your prison has the new Contacts service in DPS.',
        html: `You can access guidance and demo videos on our <a class="govuk-notification-banner__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C" target="_blank" rel="noopener noreferrer">SharePoint site</a>. If you think you need a different role, read this article, and speak to your LSA. The equivalent NOMIS functionality will be disabled in the coming months with read-only access. If you have any questions, contact <a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>`,
      }
      // Act & Assert
      expect(getAnnouncement()).toMatchObject(expectedAnnouncement)
    })
  })
})
