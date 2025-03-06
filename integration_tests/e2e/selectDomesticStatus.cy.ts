import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SelectDomesticStatusPage from '../pages/contact-details/additional-information/selectDomesticStatusPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

export type PatchContactRequest = components['schemas']['PatchContactRequest']

context('Select Domestic Status', () => {
  const contactId = 22
  const prisonerContactId = 987654
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task(
      'stubGetContactById',
      TestData.contact({
        domesticStatusCode: 'M',
        domesticStatusDescription: 'Married',
      }),
    )
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
    cy.signIn()
  })

  it(`should update contact details domestic status`, () => {
    visitContactPage(
      TestData.contact({
        domesticStatusCode: 'M',
        domesticStatusDescription: 'Married',
      }),
    )

    const request: PatchContactRequest = {
      domesticStatusCode: 'S',
      updatedBy: 'USER1',
    }
    cy.task('stubTitlesReferenceData')
    cy.task('stubGetDomesticStatuses')
    cy.task('stubPatchContactById', { contactId, request })

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .verifyShowDomesticStatusAs('Married')
      .clickChangeDomesticStatusLink()

    Page.verifyOnPage(SelectDomesticStatusPage, 'Jones Mason')
      .verifyDomesticStatus('M')
      .selectDomesticStatus('S')
      .continueTo(ManageContactDetailsPage, 'Jones Mason')
      .hasSuccessBanner('You’ve updated the additional information for Jones Mason.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        domesticStatusCode: 'S',
        updatedBy: 'USER1',
      },
    )
  })

  it(`should require mandatory input`, () => {
    visitContactPage({
      ...TestData.contact(),
      domesticStatusCode: undefined,
      domesticStatusDescription: undefined,
    })

    cy.task('stubTitlesReferenceData')
    cy.task('stubGetDomesticStatuses')

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeDomesticStatusLink()

    Page.verifyOnPage(SelectDomesticStatusPage, 'Jones Mason')
      .continueTo(SelectDomesticStatusPage, 'Jones Mason')
      .hasFieldInError('domesticStatusCode', 'Select the contact’s domestic status')
  })

  it('goes to correct page on Back or Cancel', () => {
    visitContactPage(TestData.contact())

    cy.task('stubTitlesReferenceData')
    cy.task('stubGetDomesticStatuses')

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'Jones Mason') //
      .clickChangeDomesticStatusLink()

    // Back to Edit Contact Details
    Page.verifyOnPage(SelectDomesticStatusPage, 'Jones Mason') //
      .backTo(EditContactDetailsPage, 'Jones Mason')
      .clickChangeDomesticStatusLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(SelectDomesticStatusPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })

  const visitContactPage = (contact: {
    id: number
    domesticStatusCode?: string
    domesticStatusDescription?: string
  }) => {
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  }
})
