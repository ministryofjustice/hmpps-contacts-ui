import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import EnterIdentityPage from '../pages/enterIdentityPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubIdentityDetails } from '../mockApis/contactsApi'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

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

  it('Can edit a contact identity with minimal fields', () => {
    const updated: StubIdentityDetails = {
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

    Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') // without issuing authority
      .hasIdentity('LAST-8773671M')
      .enterIdentity('123434')
      .hasType('DL')
      .selectType('NINO')
      .hasIssuingAuthority('UK')
      .clearIssuingAuthority()
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/identity/1`,
      },
      { identityType: 'NINO', identityValue: '123434', updatedBy: 'USER1' },
    )
  })

  it('Can edit a contact identity with all fields', () => {
    const updated: StubIdentityDetails = {
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

    Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .hasIdentity('LAST-8773671M')
      .enterIdentity('987654321')
      .hasIssuingAuthority('UK')
      .enterIssuingAuthority('USA')
      .hasType('DL')
      .selectType('NINO')
      .clickContinue()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/identity/1`,
      },
      { identityType: 'NINO', identityValue: '987654321', issuingAuthority: 'USA', updatedBy: 'USER1' },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .selectType('')
      .enterIdentity('425362965')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('type', 'Select the type of identity number')
  })

  it('Should require identity number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .clearIdentity()
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identity', 'Enter the identity number')
  })

  it('Should require identity is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .enterIdentity(''.padEnd(21, '0'))
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identity', 'Identity number should be 20 characters or fewer')
  })

  it('Should require issuing authority is 7 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .selectType('PASS')
      .enterIdentity('0123')
      .enterIssuingAuthority(''.padEnd(41, '0'))

    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('issuingAuthority', 'Issuing authority should be 40 characters or fewer')
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickEditIdentityLink('LAST-8773671M')

    Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .cancelTo(EditContactDetailsPage, 'First Middle Names Last')
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
