import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import SelectSpokenLanguagePage from '../pages/selectSpokenLanguage'

context('Select Spoken Language', () => {
  beforeEach(() => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubContactList', 'A1234BC')
    cy.visit('/contacts/manage/prisoner-search/start')
  })

  it(`should render manage contact details spoken language`, () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubTitlesReferenceData')
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubContactList', 'A1234BC')
    cy.task('stubGetLanguages')

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage).clickChangeSpokenLanguageLik()

    Page.verifyOnPage(SelectSpokenLanguagePage, 'Jones Mason')
  })
})
