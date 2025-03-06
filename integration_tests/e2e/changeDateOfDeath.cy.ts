import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import DateOfDeathPage from '../pages/contact-details/dateOfDeathPage'

context('Change date of death', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    deceasedDate: '2024-02-03',
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        isEmergencyContact: true,
      }),
    })
    cy.task('stubPatchContactById', { contactId, response: contact })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can change date of death from edit contact details', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'CHANGE') //
      .hasDay('3')
      .hasMonth('2')
      .hasYear('2024')
      .enterDay('1')
      .enterMonth('2')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .hasSuccessBanner('You’ve updated the personal information for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      { deceasedDate: '2000-02-01T00:00:00.000Z', updatedBy: 'USER1' },
    )
  })

  it(`Back link goes to edit contact details`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'CHANGE') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last (deceased)')
  })

  it(`Cancel goes to manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last (deceased)') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'CHANGE') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last (deceased)')
  })
})
