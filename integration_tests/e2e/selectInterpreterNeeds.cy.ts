import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import SelectInterpreterNeedsPage from '../pages/selectInterpreterNeedsPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Interpreter Needs', () => {
  const contactId = 22
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
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
    cy.task('stubTitlesReferenceData')
    cy.task('stubGetLanguages')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubContactList', 'A1234BC')
    cy.visit('/contacts/manage/prisoner-search/start')
  })

  it(`can select 'Yes' for interpreter needs`, () => {
    const request: PatchContactRequest = {
      interpreterRequired: true,
      updatedBy: 'USER1',
    }
    cy.task('stubUpdateSpokenLanguage', { contactId, request })
    cy.task('stubGetContactById', TestData.contact({ interpreterRequired: true }))

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage).clickAddInterpreterLink()
    Page.verifyOnPage(SelectInterpreterNeedsPage, 'Jones Mason').selectIsInterpreterNeeded('YES').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').verifyShowNeedsInterpreterValueAs('Yes')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        interpreterRequired: true,
      },
    )
  })

  it(`can select 'No' for interpreter needs`, () => {
    const request: PatchContactRequest = {
      interpreterRequired: false,
      updatedBy: 'USER1',
    }
    cy.task('stubUpdateSpokenLanguage', { contactId, request })
    cy.task('stubGetContactById', TestData.contact({ interpreterRequired: false }))

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage).clickAddInterpreterLink()
    Page.verifyOnPage(SelectInterpreterNeedsPage, 'Jones Mason').selectIsInterpreterNeeded('NO').clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').verifyShowNeedsInterpreterValueAs('No')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        interpreterRequired: false,
      },
    )
  })

  it(`should return to manage contact when cancel is clicked`, () => {
    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage).clickAddInterpreterLink()
    Page.verifyOnPage(SelectInterpreterNeedsPage, 'Jones Mason').clickCancel()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })
})
