import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPatchContactResponse } from '../mockApis/contactsApi'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import EnterContactEstimatedDateOfBirthPage from '../pages/enterContactEstimatedDateOfBirthPage'

context('Change Contact Date Of Birth', () => {
  const contactId = 654321
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.signIn()
  })

  it('Can edit a contact with an existing date of birth to another date of birth', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: '1982-06-15',
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    const updated: StubPatchContactResponse = {
      ...contact,
      dateOfBirth: '2000-12-25',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickChangeDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names') //
      .hasIsKnown('YES')
      .hasDay('15')
      .hasMonth('6')
      .hasYear('1982')
      .enterDay('25')
      .enterMonth('12')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        dateOfBirth: '2000-12-25T00:00:00.000Z',
        estimatedIsOverEighteen: null,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a contact with no existing date of birth or estimated date of birth to a known date of birth', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    const updated: StubPatchContactResponse = {
      ...contact,
      dateOfBirth: '2000-12-25',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickChangeDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names') //
      .isEmptyForm()
      .selectIsKnown('YES')
      .enterDay('25')
      .enterMonth('12')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        dateOfBirth: '2000-12-25T00:00:00.000Z',
        estimatedIsOverEighteen: null,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a contact with no existing date of birth but has estimated date of birth to a known date of birth', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: 'YES',
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    const updated: StubPatchContactResponse = {
      ...contact,
      dateOfBirth: '2000-12-25',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickChangeDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names') //
      .hasIsKnown('NO')
      .selectIsKnown('YES')
      .enterDay('25')
      .enterMonth('12')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        dateOfBirth: '2000-12-25T00:00:00.000Z',
        estimatedIsOverEighteen: null,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a contact with no existing date of birth but has estimated date of birth and change the estimated dob only', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: 'YES',
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    const updated: StubPatchContactResponse = {
      ...contact,
      dateOfBirth: null,
      estimatedIsOverEighteen: 'NO',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickChangeDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names') //
      .hasIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First Middle Names') //
      .hasIsOverEighteen('YES')
      .selectIsOverEighteen('NO')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        dateOfBirth: null,
        estimatedIsOverEighteen: 'NO',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a contact with no existing date of birth or estimated date of birth and set the estimated dob only', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    const updated: StubPatchContactResponse = {
      ...contact,
      dateOfBirth: null,
      estimatedIsOverEighteen: 'DO_NOT_KNOW',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names') //
      .isEmptyForm()
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First Middle Names') //
      .isEmptyForm()
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      {
        dateOfBirth: null,
        estimatedIsOverEighteen: 'DO_NOT_KNOW',
        updatedBy: 'USER1',
      },
    )
  })

  it('Must select whether dob is known', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfBirthLink(contactId)

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names')
    enterDobPage.clickContinue()

    enterDobPage.hasFieldInError('isKnown', 'Select whether the date of birth is known')
  })

  it('Must enter dob if it is known', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfBirthLink(contactId)

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names')
    enterDobPage.selectIsKnown('YES').clickContinue()
    enterDobPage.hasFieldInError('dob', "Enter the contact's date of birth")
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain("Enter the contact's date of birth")
    })
  })

  it('Day, month and year must be numbers', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfBirthLink(contactId)

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names')
    enterDobPage
      .selectIsKnown('YES') //
      .enterDay('aa')
      .enterMonth('bb')
      .enterYear('cc')
      .clickContinue()

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
  })

  it('Must select whether contact is over 18 if no dob is known', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      dateOfBirth: null,
      estimatedIsOverEighteen: null,
    })
    cy.task('stubGetContactById', contact)
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle Names') //
      .selectIsKnown('NO')
      .clickContinue()

    const estimatedDobPage = Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First Middle Names')
    estimatedDobPage.clickContinue()

    estimatedDobPage.hasFieldInError('isOverEighteen', 'Select whether the contact is over 18')
  })
})
