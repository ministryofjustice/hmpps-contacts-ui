import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import SelectDomesticStatusPage from '../pages/selectDomesticStatusPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Domestic Status', () => {
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

  it(`should render manage contact details domestic status`, () => {
    const request: PatchContactRequest = {
      domesticStatus: 'S',
      updatedBy: 'USER1',
    }
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubTitlesReferenceData')
    cy.task('stubGetDomesticStatuses')
    cy.task('stubPatchContactById', { contactId, request })

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage).clickChangeDomesticStatusLink()
    Page.verifyOnPage(SelectDomesticStatusPage, 'Jones Mason')
      .selectDomesticStatus('Single-not married/in civil partnership')
      .clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').verifyDomesticStatusValueAs(
      'Single-not married/in civil partnership',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        domesticStatus: 'S',
      },
    )
  })
})
