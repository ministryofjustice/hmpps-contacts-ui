import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SelectStaffStatusPage from '../pages/contact-details/selectStaffStatus'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import { PatchContactRequest } from '../../server/@types/contactsApiClient'

context('Select Staff Status', () => {
  const prisoner = TestData.prisoner()
  const contactId = 22
  const prisonerContactId = 31
  const { prisonerNumber } = prisoner

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubGetContactById', TestData.contact({ id: contactId }))
    cy.task('stubGetContactNameById', TestData.contact())
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubGetContactHistory', { contactId, history: [] })
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
  })

  it(`should render manage contact details staff status`, () => {
    const request: PatchContactRequest = {
      isStaff: true,
    }
    cy.task('stubPatchContactById', { contactId, request })

    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowStaffStatusValueAs('No')
      .clickChangeStaffStatusLink()

    Page.verifyOnPage(SelectStaffStatusPage, 'Jones Mason', false) //
      .selectStaffStatus('YES')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .hasSuccessBanner('You’ve updated the personal information for Jones Mason.')

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

  it('goes to correct page on Back or Cancel', () => {
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })
    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowStaffStatusValueAs('No')
      .clickChangeStaffStatusLink()

    // Back to Edit Contact Details
    Page.verifyOnPage(SelectStaffStatusPage, 'Jones Mason', false) //
      .backTo(EditContactDetailsPage, 'Jones Mason')
      .clickChangeStaffStatusLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(SelectStaffStatusPage, 'Jones Mason', false) //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
