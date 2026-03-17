import Page from '../../pages/page'
import TestData from '../../../server/routes/testutils/testData'
import AddIdentityDocumentPage from '../../pages/addIdentityDocumentPage'
import ManageContactDetailsPage from '../../pages/manageContactDetails'
import EditContactDetailsPage from '../../pages/editContactDetailsPage'
import { ContactIdentityDetails } from '../../../server/@types/contactsApiClient'

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
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubIdentityTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
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
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubGetContactHistory', { contactId, history: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can create multiple contact identities', () => {
    const first: ContactIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityType: 'PASS',
      identityTypeIsActive: true,
      identityValue: '425362965',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    const second: ContactIdentityDetails = {
      contactIdentityId: 2,
      contactId,
      identityType: 'DL',
      identityTypeIsActive: true,
      identityValue: '123456',
      issuingAuthority: 'DVLA',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    // Add first identity doc
    cy.task('stubCreateContactIdentity', { contactId, created: first })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('PASS')
      .enterIdentity('425362965')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the identity documentation for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/identity`,
      },
      {
        identityType: 'PASS',
        identityValue: '425362965',
      },
    )

    // Add second identity doc
    cy.task('stubCreateContactIdentity', { contactId, created: second })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('DL')
      .enterIdentity('123456')
      .enterIssuingAuthority('DVLA')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the identity documentation for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/identity`,
      },

      {
        identityType: 'DL',
        identityValue: '123456',
        issuingAuthority: 'DVLA',
      },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .enterIdentity('425362965')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identityType', 'Select the document type')
  })

  it('Should require identity number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('NINO')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identityValue', 'Enter the document number')
  })

  it('Should require identity number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('NINO')
      .enterIdentity(''.padEnd(21, '0'))
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identityValue', 'Document number must be 20 characters or less')
  })

  it('Should require Issuing authority is 40 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('NINO')
      .enterIdentity('0123')
      .enterIssuingAuthority(''.padEnd(41, '0'))

    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('issuingAuthority', 'Issuing authority must be 40 characters or less')
  })

  it('Back link goes to edit contact details then manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(AddIdentityDocumentPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
