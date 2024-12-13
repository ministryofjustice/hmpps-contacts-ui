import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import { StubPrisonerContactRestrictionDetails } from '../mockApis/contactsApi'
import EnterRestrictionPage from '../pages/enterRestrictionPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'

context('Update Prisoner Contact Restriction', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const restrictionId = 555333
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
  })
  const prisonerContactRestriction = TestData.getPrisonerContactRestrictionDetails({
    prisonerContactRestrictionId: restrictionId,
    contactId: contact.id,
    restrictionType: 'CHILD',
    startDate: '2024-01-01',
    expiryDate: '2050-08-01',
    comments: 'Keep an eye',
  })
  const prisoner = TestData.prisoner()
  const { prisonerNumber } = prisoner
  const enterPageTitle = 'Update a prisoner-contact restriction'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubRestrictionTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [prisonerContactRestriction],
        contactGlobalRestrictions: [],
      },
    })
    cy.signIn()

    // TODO visit here from the prisoner contact page instead of directly
    cy.visit(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/PRISONER_CONTACT/enter-restriction/${restrictionId}?returnUrl=/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    )
  })

  it('Can update a prisoner contact restriction with minimal fields', () => {
    const updated: Partial<StubPrisonerContactRestrictionDetails> = {
      prisonerContactRestrictionId: restrictionId,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubUpdatePrisonerContactRestriction', { prisonerContactId, restrictionId, updated })

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .hasType('CHILD')
      .hasStartDate('01/01/2024')
      .hasExpiryDate('01/08/2050')
      .hasComments('Keep an eye')
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .clearExpiryDate()
      .clearComments()
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner("You've updated a prisoner-contact restriction")

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/prisoner-contact/${prisonerContactId}/restriction/${restrictionId}`,
      },
      {
        restrictionType: 'CCTV',
        startDate: '1982-06-15',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update a prisoner contact restriction with all fields', () => {
    const updated: Partial<StubPrisonerContactRestrictionDetails> = {
      prisonerContactRestrictionId: restrictionId,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubUpdatePrisonerContactRestriction', { prisonerContactId, restrictionId, updated })

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .hasType('CHILD')
      .hasStartDate('01/01/2024')
      .hasExpiryDate('01/08/2050')
      .hasComments('Keep an eye')
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .enterExpiryDate('25/12/2000')
      .enterComments('Updated comments')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner("You've updated a prisoner-contact restriction")

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/prisoner-contact/${prisonerContactId}/restriction/${restrictionId}`,
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

  it('Type and start date are required', () => {
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, enterPageTitle)
    enterRestrictionPage //
      .selectType('')
      .clearStartDate()
      .clearExpiryDate()
      .clearComments()
      .clickContinue()

    enterRestrictionPage.hasFieldInError('type', 'Select the restriction type')
    enterRestrictionPage.hasFieldInError('startDate', 'Enter the start date')
  })
})
