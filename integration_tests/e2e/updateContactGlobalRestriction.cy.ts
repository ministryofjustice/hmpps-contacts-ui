import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import EnterRestrictionPage from '../pages/enterRestrictionPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditRestrictionsPage from '../pages/editRestrictionsPage'
import { ContactRestrictionDetails } from '../../server/@types/contactsApiClient'

context('Update Contact Global Restriction', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const restrictionId = 555333
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
  })
  const globalRestriction = TestData.getContactRestrictionDetails({
    contactRestrictionId: restrictionId,
    contactId: contact.id,
    restrictionType: 'BAN',
    restrictionTypeDescription: 'Banned',
    startDate: '2024-01-01',
    expiryDate: '2050-08-01',
    comments: 'Keep an eye',
  })
  const prisoner = TestData.prisoner()
  const { prisonerNumber } = prisoner
  const enterPageTitle = 'Update a global restriction for contact First Middle Names Last'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubRestrictionTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetGlobalRestrictions', [globalRestriction])
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [globalRestriction],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })

    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickRestrictionsTab('1')
      .verifyOnRestrictionsTab()
      .clickLinkTo('Add or update restrictions', EditRestrictionsPage, 'First Middle Names Last')
      .clickLink('Change this Banned global restriction')
  })

  it('Can update a global restriction for a contact with minimal fields', () => {
    const updated: Partial<ContactRestrictionDetails> = {
      contactRestrictionId: restrictionId,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubUpdateContactRestriction', { contactId, restrictionId, updated })

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .hasType('BAN')
      .hasStartDate('01/01/2024')
      .hasExpiryDate('01/08/2050')
      .hasComments('Keep an eye')
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .clearExpiryDate()
      .clearComments()
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the global restrictions for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/restriction/${restrictionId}`,
      },
      {
        restrictionType: 'CCTV',
        startDate: '1982-06-15',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update a global restriction for a contact with all fields', () => {
    const updated: Partial<ContactRestrictionDetails> = {
      contactRestrictionId: restrictionId,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubUpdateContactRestriction', { contactId, restrictionId, updated })

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .hasType('BAN')
      .hasStartDate('01/01/2024')
      .hasExpiryDate('01/08/2050')
      .hasComments('Keep an eye')
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .enterExpiryDate('25/12/2000')
      .enterComments('Updated comments')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the global restrictions for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/restriction/${restrictionId}`,
      },
      {
        restrictionType: 'CCTV',
        startDate: '1982-06-15',
        expiryDate: '2000-12-25',
        comments: 'Updated comments',
        updatedBy: 'USER1',
      },
    )
  })
  it('Start date is required', () => {
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, enterPageTitle)
    enterRestrictionPage //
      .clearStartDate()
      .clearExpiryDate()
      .clearComments()
      .clickContinue()

    enterRestrictionPage.hasFieldInError('startDate', 'Enter the start date')
  })

  it('Expiry date should be after the Start date', () => {
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, enterPageTitle)
    enterRestrictionPage //
      .selectType('CCTV')
      .enterStartDate('28/02/2024')
      .enterExpiryDate('27/02/2024')
      .enterComments(''.padEnd(20, 'X'))
      .clickContinue()

    enterRestrictionPage.hasFieldInError(
      'expiryDate',
      'End date must be the same as or after the start date February 2024',
    )

    enterRestrictionPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('End date must be the same as or after the start date February 2024')
    })
  })

  it('Back link goes to manage contact', () => {
    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .backTo(EditRestrictionsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
