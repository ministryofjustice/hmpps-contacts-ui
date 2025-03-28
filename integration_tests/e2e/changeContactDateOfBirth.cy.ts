import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPatchContactResponse } from '../mockApis/contactsApi'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Change Contact Date Of Birth', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
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

  it('Can edit a contact with an existing date of birth to another date of birth', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: '1982-06-15',
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    const updated: StubPatchContactResponse = {
      ...contact,
      dateOfBirth: '2000-12-25',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowDOBValueAs('15 June 1982')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(ManageDobPage, 'First Middle Names Last') //
      .hasDay('15')
      .hasMonth('6')
      .hasYear('1982')
      .enterDay('25')
      .enterMonth('12')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the personal information for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        dateOfBirth: '2000-12-25T00:00:00.000Z',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a contact with no existing date of birth to a known date of birth', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    const updated: StubPatchContactResponse = {
      ...contact,
      dateOfBirth: '2000-12-25',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowDOBValueAs('Not provided')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(ManageDobPage, 'First Middle Names Last') //
      .enterDay('25')
      .enterMonth('12')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the personal information for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        dateOfBirth: '2000-12-25T00:00:00.000Z',
        updatedBy: 'USER1',
      },
    )
  })

  it('validates day-month-year inputs', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowDOBValueAs('Not provided')
      .clickChangeDateOfBirthLink()

    const enterDobPage = Page.verifyOnPage(ManageDobPage, 'First Middle Names Last')

    // Must enter dob
    enterDobPage.clickContinue()
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Enter the date of birth')
    })

    // Day, month and year must present, year must have 4 numbers
    enterDobPage.enterYear('99').clickContinue()
    enterDobPage.hasFieldInError('year', 'Year must include 4 numbers')
    enterDobPage.hasFieldInError('day', 'Date of birth must include a day and a month')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(2)
    })

    // Must be a real date
    enterDobPage.enterDay('a').enterMonth('a').enterYear('abcd').clickContinue()
    enterDobPage.hasFieldInError('day', 'Date of birth must be a real date')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
    })

    // Date must not be in the future
    enterDobPage
      .enterDay('31')
      .enterMonth('12')
      .enterYear((new Date().getFullYear() + 1).toString())
      .clickContinue()
    enterDobPage.hasFieldInError('dob', 'Date of birth must be in the past')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
    })
  })

  it('goes to correct page on Back or Cancel', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    const editDetailsPage = Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowDOBValueAs('Not provided')
    editDetailsPage.clickChangeDateOfBirthLink()

    // Back to Edit Contact Details
    Page.verifyOnPage(ManageDobPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')

    editDetailsPage.clickChangeDateOfBirthLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(ManageDobPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
