import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import AddIdentityDocumentsPage from '../pages/addIdentityDocumentsPage'
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
    const { prisonerNumber } = TestData.prisoner()
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can create multiple contact identities', () => {
    const first: StubIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityType: 'PASS',
      identityTypeIsActive: true,
      identityValue: '425362965',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    const second: StubIdentityDetails = {
      contactIdentityId: 2,
      contactId,
      identityType: 'DL',
      identityTypeIsActive: true,
      identityValue: '123456',
      issuingAuthority: 'DVLA',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactIdentities', { contactId, created: [first, second] })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .selectType(0, 'PASS')
      .enterIdentity(0, '425362965')
      .clickAddAnotherButton()
      .selectType(1, 'PASS')
      .enterIdentity(1, 'REMOVING THIS ONE')
      .clickAddAnotherButton()
      .selectType(2, 'DL')
      .enterIdentity(2, '123456')
      .enterIssuingAuthority(2, 'DVLA')
      .clickRemoveButton(1)
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the identity documentation for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/identities`,
      },
      {
        identities: [
          {
            identityType: 'PASS',
            identityValue: '425362965',
          },
          {
            identityType: 'DL',
            identityValue: '123456',
            issuingAuthority: 'DVLA',
          },
        ],
        createdBy: 'USER1',
      },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .enterIdentity(0, '425362965')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identities[0].identityType', 'Select the document type')
  })

  it('Should require identity number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .selectType(0, 'NINO')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identities[0].identityValue', 'Enter the document number')
  })

  it('Should require identity number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .selectType(0, 'NINO')
      .enterIdentity(0, ''.padEnd(21, '0'))
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identities[0].identityValue', 'Document number must be 20 characters or less')
  })

  it('Should require Issuing authority is 40 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .selectType(0, 'NINO')
      .enterIdentity(0, '0123')
      .enterIssuingAuthority(0, ''.padEnd(41, '0'))

    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError(
      'identities[0].issuingAuthority',
      'Issuing authority must be 40 characters or less',
    )
  })

  it('Should keep details of other identities if a different one has an error', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    const enterIdentityPage = Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .selectType(0, 'DL')
      .enterIdentity(0, '0123')
      .enterIssuingAuthority(0, 'DVLA')
      .clickAddAnotherButton()
      .enterIdentity(1, '425362965')

    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identities[1].identityType', 'Select the document type')

    enterIdentityPage //
      .hasType(0, 'DL')
      .hasIdentity(0, '0123')
      .hasIssuingAuthority(0, 'DVLA')
      .hasType(1, '')
      .hasIdentity(1, '425362965')
      .hasIssuingAuthority(1, '')
  })

  it('Back link goes to edit contact details then manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickAddIdentityDocumentLink()

    Page.verifyOnPage(AddIdentityDocumentsPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
