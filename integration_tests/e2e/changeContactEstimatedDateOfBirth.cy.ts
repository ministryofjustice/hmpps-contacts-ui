import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPatchContactResponse } from '../mockApis/contactsApi'
import EnterContactEstimatedDateOfBirthPage from '../pages/enterContactEstimatedDateOfBirthPage'

context('Change Contact Estimated Date Of Birth', () => {
  const contactId = 654321
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetGenders')
    cy.signIn()
  })

  it('Can edit a contact with an existing estimated date of birth', () => {
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
      estimatedIsOverEighteen: 'NO',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeEstimatedDateOfBirthLink(contactId)

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
        estimatedIsOverEighteen: 'NO',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a contact with no existing estimated date of birth', () => {
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
      estimatedIsOverEighteen: 'DO_NOT_KNOW',
    }
    cy.task('stubPatchContactById', { contactId, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeEstimatedDateOfBirthLink(contactId)

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
        estimatedIsOverEighteen: 'DO_NOT_KNOW',
        updatedBy: 'USER1',
      },
    )
  })

  it('Must select a value if none was known previously', () => {
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeEstimatedDateOfBirthLink(contactId)

    const estimatedDobPage = Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First Middle Names')
    estimatedDobPage.isEmptyForm().clickContinue()
    estimatedDobPage.hasFieldInError('isOverEighteen', 'Select whether the contact is over 18')
  })

  it('Back link goes to manage contact', () => {
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeEstimatedDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First Middle Names') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel link goes to manage contact', () => {
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickChangeEstimatedDateOfBirthLink(contactId)

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First Middle Names') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
