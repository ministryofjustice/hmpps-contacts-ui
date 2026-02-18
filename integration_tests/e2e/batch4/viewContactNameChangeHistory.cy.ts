import Page from '../../pages/page'
import TestData from '../../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../../pages/manageContactDetails'
import pagedPrisonerAlertsData from '../../../server/testutils/testPrisonerAlertsData'

context('View Contact Name Change History', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubGetContactHistory', { contactId, history: [] })
  })

  it('Can view a contact with new title, first, middle and last names and history of name change', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: null,
      titleCode: null,
      titleDescription: null,
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task(
      'stubPrisonerAlertsById',
      pagedPrisonerAlertsData({
        prisonNumber: 'A1234BC',
      }),
    )
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    // Three revisions (two older then newer) so service will derive two name change entry
    const moreolder = {
      firstName: 'Alice',
      middleNames: '',
      lastName: 'Smith',
      updatedBy: 'User admin',
      updatedTime: '2023-07-15T10:00:00.000Z',
    }
    const older = {
      firstName: 'Alice',
      middleNames: '',
      lastName: 'Jones',
      updatedBy: 'User One',
      updatedTime: '2024-07-15T10:00:00.000Z',
    }
    const newer = {
      firstName: 'Alice',
      middleNames: 'Becky',
      lastName: 'Jones',
      updatedBy: 'User Two',
      updatedTime: '2024-08-05T09:00:00.000Z',
    }
    cy.task('stubGetContactHistory', { contactId, history: [newer, older, moreolder] })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .verifyNameChangeDetailsSummaryPresent()
      .verifyNameChangeHistoryWarning('1 November 2023')
      .verifyLatestNameChangeCard({
        changedOn: '5 August 2024',
        newName: 'Alice Becky Jones',
        previousName: 'Alice Jones',
        updatedBy: 'User Two',
      })
      .verifyPreviousNameChangeCard(1, {
        changedOn: '15 July 2024',
        newName: 'Alice Jones',
        previousName: 'Alice Smith',
        updatedBy: 'User One',
      })
  })

  it('Can view a contact without previous name changes history records', () => {
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: null,
      titleCode: null,
      titleDescription: null,
      dateOfBirth: null,
    })
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })
    // Empty name change entries
    cy.task('stubGetContactHistory', { contactId, history: [] })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last') //
      .verifyNoNameChangeHistoryCards()
  })
})
