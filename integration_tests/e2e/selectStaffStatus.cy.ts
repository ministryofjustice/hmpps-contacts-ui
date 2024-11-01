import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import SelectStaffStatusPage from '../pages/selectStaffStatus'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Staff Status', () => {
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

  it(`should render manage contact details staff status`, () => {
    const request: PatchContactRequest = {
      isStaff: true,
      updatedBy: 'USER1',
    }
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubTitlesReferenceData')
    cy.task('stubPatchContactById', { contactId, request })

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')
    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
      .verifyShowStaffStatusValueAs('No')
      .clickChangeStaffStatusLink()
    Page.verifyOnPage(SelectStaffStatusPage, 'Jones Mason').selectStaffStatus().clickContinue()
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason').clickChangeStaffStatusLink()
    Page.verifyOnPage(SelectStaffStatusPage, 'Jones Mason').selectStaffStatus().clickCancel()

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        isStaff: true,
      },
    )
  })
})
