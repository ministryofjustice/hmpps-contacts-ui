import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import Page from '../pages/page'
import SelectDomesticStatusPage from '../pages/selectDomesticStatusPage'

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
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`should render manage contact details domestic status`, () => {
    const request: PatchContactRequest = {
      domesticStatus: 'S',
      updatedBy: 'USER1',
    }
    cy.task('stubTitlesReferenceData')
    cy.task('stubGetDomesticStatuses')
    cy.task('stubPatchContactById', { contactId, request })

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

  it(`Back link goes to manage contacts`, () => {
    cy.task('stubTitlesReferenceData')
    cy.task('stubGetDomesticStatuses')

    Page.verifyOnPage(ManageContactDetailsPage).clickChangeDomesticStatusLink()
    Page.verifyOnPage(SelectDomesticStatusPage, 'Jones Mason') //
      .backTo(ManageContactDetailsPage, 'Jones Mason')
  })

  it(`Cancel goes to manage contacts`, () => {
    cy.task('stubTitlesReferenceData')
    cy.task('stubGetDomesticStatuses')

    Page.verifyOnPage(ManageContactDetailsPage).clickChangeDomesticStatusLink()
    Page.verifyOnPage(SelectDomesticStatusPage, 'Jones Mason') //
      .cancelTo(ManageContactDetailsPage, 'Jones Mason')
  })
})
