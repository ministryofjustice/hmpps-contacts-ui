import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import DateOfDeathPage from '../pages/contact-details/dateOfDeathPage'

context('Record date of death', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
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
    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can record date of death from edit contact details', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickRecordDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD') //
      .enterDay('1')
      .enterMonth('2')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the personal information for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      { deceasedDate: '2000-02-01T00:00:00.000Z', updatedBy: 'USER1' },
    )
  })

  it('Can record date of death from manage contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickRecordDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD') //
      .enterDay('1')
      .enterMonth('2')
      .enterYear('2000')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .hasSuccessBanner('You’ve updated the personal information for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      { deceasedDate: '2000-02-01T00:00:00.000Z', updatedBy: 'USER1' },
    )
  })

  it('Highlights relevant fields for multi field error with only one message for the first field', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickRecordDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD') //
      .enterYear('2000')
      .clickContinue()

    const dodPage = Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD')
    dodPage.hasFieldInError('day', 'Date of death must include a day and a month')

    dodPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of death must include a day and a month')
    })

    dodPage.hasFieldHighlightedWithError('day')
    dodPage.hasFieldHighlightedWithError('month')
  })

  it(`Back link from edit contact details goes to edit contact details`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickRecordDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it(`Back link from manage contact goes to manage contact`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickRecordDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it(`Cancel goes to manage contacts from edit contact details`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickRecordDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it(`Cancel goes to manage contacts from manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickRecordDateOfDeathLink()

    Page.verifyOnPage(DateOfDeathPage, 'First Middle Names Last', 'RECORD') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
