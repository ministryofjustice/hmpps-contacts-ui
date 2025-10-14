import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ChangeIdentityDocumentPage from '../pages/changeIdentityDocumentPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import { ContactIdentityDetails } from '../../server/@types/contactsApiClient'

context('Edit Contact Identities', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    identities: [
      TestData.getContactIdentityDetails('DL', 'Driving licence', 'LAST-8773671M', 'UK', 1, true),
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
    cy.task('stubGetContactNameById', contact)
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

  it('Can edit a contact identity with minimal fields', () => {
    const updated: ContactIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityValue: '425362965',
      identityType: 'PASS',
      identityTypeIsActive: true,
      issuingAuthority: 'UK',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
      updatedBy: 'USER1',
      updatedTime: new Date().toISOString(),
    }
    cy.task('stubUpdateContactIdentity', { contactId, contactIdentityId: 1, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') // without issuing authority
      .hasIdentity('LAST-8773671M')
      .enterIdentity('123434')
      .hasType('DL')
      .selectType('NINO')
      .hasIssuingAuthority('UK')
      .clearIssuingAuthority()
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the identity documentation for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/identity/1`,
      },
      { identityType: 'NINO', identityValue: '123434' },
    )
  })

  it('Can edit a contact identity with all fields', () => {
    const updated: ContactIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityType: 'PASS',
      identityTypeIsActive: true,
      identityValue: '1233445',
      issuingAuthority: 'UK',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
      updatedBy: 'USER1',
      updatedTime: new Date().toISOString(),
    }
    cy.task('stubUpdateContactIdentity', { contactId, contactIdentityId: 1, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .hasIdentity('LAST-8773671M')
      .enterIdentity('987654321')
      .hasIssuingAuthority('UK')
      .enterIssuingAuthority('USA')
      .hasType('DL')
      .selectType('NINO')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the identity documentation for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/identity/1`,
      },
      { identityType: 'NINO', identityValue: '987654321', issuingAuthority: 'USA' },
    )
  })

  it('Should require identity number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    const enterIdentityPage = Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .clearIdentity()
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identityValue', 'Enter the document number')
  })

  it('Should require identity is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    const enterIdentityPage = Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .enterIdentity(''.padEnd(21, '0'))
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identityValue', 'Document number must be 20 characters or less')
  })

  it('Should require issuing authority is 7 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    const enterIdentityPage = Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .selectType('PASS')
      .enterIdentity('0123')
      .enterIssuingAuthority(''.padEnd(41, '0'))

    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('issuingAuthority', 'Issuing authority must be 40 characters or less')
  })

  it('Back link goes to edit contact details then contact details', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to contact details', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    Page.verifyOnPage(ChangeIdentityDocumentPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
