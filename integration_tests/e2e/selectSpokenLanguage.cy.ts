import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import SelectSpokenLanguagePage from '../pages/selectSpokenLanguage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Spoken Language', () => {
  const contactId = 22
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
    const request: PatchContactRequest = {
      languageCode: 'ARA',
      updatedBy: 'USER1',
    }
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubTitlesReferenceData')
    cy.task('stubGetLanguages')
    cy.task('stubUpdateSpokenLanguage', { contactId, request })

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage).clickChangeSpokenLanguageLik()

    Page.verifyOnPage(SelectSpokenLanguagePage, 'Jones Mason').selectSpokenLanguage('Arabic').clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        languageCode: 'ARA',
      },
    )
  })
})
