import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPatchContactResponse } from '../mockApis/contactsApi'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import ContactDetailsDobPage from '../pages/contact-details/dobPage'

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

    Page.verifyOnPage(ContactDetailsDobPage, 'First Middle Names Last') //
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

    Page.verifyOnPage(ContactDetailsDobPage, 'First Middle Names Last') //
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

    const enterDobPage = Page.verifyOnPage(ContactDetailsDobPage, 'First Middle Names Last')

    // Must enter dob
    enterDobPage.clickContinue()
    enterDobPage.hasFieldInError('dob', 'Enter the contact’s date of birth')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Enter the contact’s date of birth')
    })

    // Day, month and year must be numbers
    enterDobPage.enterDay('aa').enterMonth('bb').enterYear('cc').clickContinue()

    enterDobPage.hasFieldInError('dob', 'Enter a valid day of the month (1-31)')
    enterDobPage.hasFieldInError('dob', 'Enter a valid month (1-12)')
    enterDobPage.hasFieldInError('dob', 'Enter a valid year. Must be at least 1900')
    enterDobPage.hasFieldInError('dob', 'The date of birth is invalid')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(4)
      expect($lis[0]).to.contain('Enter a valid day of the month (1-31)')
      expect($lis[1]).to.contain('Enter a valid month (1-12)')
      expect($lis[2]).to.contain('Enter a valid year. Must be at least 1900')
      expect($lis[3]).to.contain('The date of birth is invalid')
    })

    // Date must not be in the future
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    enterDobPage
      .enterDay(date.getDay().toString())
      .enterMonth(date.getMonth().toString())
      .enterYear(date.getFullYear().toString())
      .clickContinue()
    enterDobPage.hasFieldInError('dob', 'The date of birth must not be in the future')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('The date of birth must not be in the future')
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
    Page.verifyOnPage(ContactDetailsDobPage, 'First Middle Names Last') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')

    editDetailsPage.clickChangeDateOfBirthLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(ContactDetailsDobPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
