import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ChangeIdentityDocumentPage from '../pages/changeIdentityDocumentPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubIdentityDetails } from '../mockApis/contactsApi'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

context('Create Contact Identity', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    identities: [
      TestData.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', 'UK', 1, true),
      TestData.getContactIdentityDetails('PASS', 'Passport number', '425362965', 'UK passport office', 2, true),
      TestData.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', 'UK', 3, true),
    ],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubIdentityTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can create a contact identity with minimal fields', () => {
    const created: StubIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityType: 'PASS',
      identityTypeIsActive: true,
      identityValue: '425362965',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactIdentity', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .enterIdentity('425362965')
      .selectType('PASS')
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/identity`,
      },
      {
        identityType: 'PASS',
        identityValue: '425362965',
        createdBy: 'USER1',
      },
    )
  })

  it('Can create a contact identity with all fields', () => {
    const created: StubIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityType: 'PASS',
      identityTypeIsActive: true,
      identityValue: '425362965',
      issuingAuthority: '000',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactIdentity', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .enterIdentity('425362965')
      .enterIssuingAuthority('000')
      .selectType('NINO')
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/identity`,
      },
      { identityType: 'NINO', identityValue: '425362965', issuingAuthority: '000', createdBy: 'USER1' },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .enterIdentity('425362965')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('type', 'Select the document type')
  })

  it('Should require identity number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('NINO')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identity', 'Enter the document number')
  })

  it('Should require identity number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('NINO')
      .enterIdentity(''.padEnd(21, '0'))
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identity', 'Document number must be 20 characters or less')
  })

  it('Should require Issuing authority is 40 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('NINO')
      .enterIdentity('0123')
      .enterIssuingAuthority(''.padEnd(41, '0'))

    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('issuingAuthority', 'Issuing authority must be 40 characters or less')
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .cancelTo(EditContactDetailsPage, 'First Middle Names Last')
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
