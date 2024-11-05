import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import EnterIdentityPage from '../pages/enterIdentityPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubIdentityDetails } from '../mockApis/contactsApi'

context('Create Contact Identity', () => {
  const contactId = 654321
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    identities: [
      TestData.getContactIdentityDetails('DRIVING_LIC', 'Driving licence', 'LAST-87736799M', 'UK', 1),
      TestData.getContactIdentityDetails(
        'PASSPORT',
        'Passport number',
        '425362965',
        'Issuing authorithy - UK passport office',
        2,
      ),
      TestData.getContactIdentityDetails('NI_NUMBER', 'National insurance number', '06/614465M', 'UK', 3),
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

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can create a contact identity with minimal fields', () => {
    const created: StubIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityType: 'PASSPORT',
      identityValue: '425362965',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactIdentity', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddIdentityLink()

    Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .enterIdentity('425362965')
      .selectType('PASSPORT')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/identity`,
      },
      {
        identityType: 'PASSPORT',
        identityValue: '425362965',
        createdBy: 'USER1',
      },
    )
  })

  it('Can create a contact identity with all fields', () => {
    const created: StubIdentityDetails = {
      contactIdentityId: 1,
      contactId,
      identityType: 'PASSPORT',
      identityTypeDescription: 'Home identity',
      identityValue: '425362965',
      issuingAuthority: '000',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactIdentity', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddIdentityLink()

    Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .enterIdentity('425362965')
      .enterIssuingAuthority('000')
      .selectType('NI_NUMBER')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/identity`,
      },
      { identityType: 'NI_NUMBER', identityValue: '425362965', issuingAuthority: '000', createdBy: 'USER1' },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddIdentityLink()

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .enterIdentity('425362965')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('type', 'Select the type of identity number')
  })

  it('Should require identity number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddIdentityLink()

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .selectType('NI_NUMBER')
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identity', 'Enter the identity number')
  })

  it('Should require identity number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddIdentityLink()

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .selectType('NI_NUMBER')
      .enterIdentity(''.padEnd(21, '0'))
    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('identity', 'Identity number should be 20 characters or fewer')
  })

  it('Should require Issuing authority is 40 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddIdentityLink()

    const enterIdentityPage = Page.verifyOnPage(EnterIdentityPage, 'First Middle Names Last') //
      .selectType('NI_NUMBER')
      .enterIdentity('0123')
      .enterIssuingAuthority(''.padEnd(41, '0'))

    enterIdentityPage.clickContinue()
    enterIdentityPage.hasFieldInError('issuingAuthority', 'Issuing authority should be 40 characters or fewer')
  })
})
