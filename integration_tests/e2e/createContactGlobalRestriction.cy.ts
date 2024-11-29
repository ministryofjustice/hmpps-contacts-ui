import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import { StubContactRestrictionDetails } from '../mockApis/contactsApi'
import EnterRestrictionPage from '../pages/enterRestrictionPage'
import CreateRestrictionCheckYourAnswersPage from '../pages/createRestrictionCheckYourAnswersPage'
import CreateRestrictionSuccessPage from '../pages/createRestrictionSuccessPage'

context('Create Contact Global Restriction', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
  })
  const prisoner = TestData.prisoner()
  const { prisonerNumber } = prisoner

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

    cy.signIn()

    // TODO visit here from the prisoner contact page instead of directly
    cy.visit(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/start?returnUrl=foo`,
    )
  })

  it('Can create a new global restriction for a contact with minimal fields', () => {
    const created: Partial<StubContactRestrictionDetails> = {
      contactRestrictionId: 99,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactRestriction', { contactId, created })

    Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL') //
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .clickContinue()

    Page.verifyOnPage(CreateRestrictionCheckYourAnswersPage, 'CONTACT_GLOBAL') //
      .verifyShowExpiryDateAs('Not provided')
      .verifyShowCommentsAs('Not provided')
      .clickContinue()

    Page.verifyOnPage(CreateRestrictionSuccessPage, 'CONTACT_GLOBAL')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/restriction`,
      },
      {
        restrictionType: 'CCTV',
        startDate: '1982-06-15',
        createdBy: 'USER1',
      },
    )
  })

  it('Can create a new global restriction for a contact with all fields', () => {
    const created: Partial<StubContactRestrictionDetails> = {
      contactRestrictionId: 99,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactRestriction', { contactId, created })

    Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL') //
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .enterExpiryDate('25/12/2025')
      .enterComments('Some comments')
      .clickContinue()

    Page.verifyOnPage(CreateRestrictionCheckYourAnswersPage, 'CONTACT_GLOBAL') //

      .clickContinue()

    Page.verifyOnPage(CreateRestrictionSuccessPage, 'CONTACT_GLOBAL')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/restriction`,
      },
      {
        restrictionType: 'CCTV',
        startDate: '1982-06-15',
        expiryDate: '2025-12-25',
        comments: 'Some comments',
        createdBy: 'USER1',
      },
    )
  })

  it('Can change answers', () => {
    const created: Partial<StubContactRestrictionDetails> = {
      contactRestrictionId: 99,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactRestriction', { contactId, created })

    Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL') //
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .enterExpiryDate('25/12/2025')
      .enterComments('Some comments')
      .clickContinue()

    Page.verifyOnPage(CreateRestrictionCheckYourAnswersPage, 'CONTACT_GLOBAL') //
      .verifyShowsTypeAs('CCTV')
      .verifyShowsStartDateAs('15 June 1982')
      .verifyShowExpiryDateAs('25 December 2025')
      .verifyShowCommentsAs('Some comments')
      .clickChangeTypeLink()

    Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL') //
      .selectType('BAN')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'CONTACT_GLOBAL')
      .verifyShowsTypeAs('Banned')
      .clickChangeStartDateLink()

    Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL') //
      .clearStartDate()
      .enterStartDate('28/02/2024')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'CONTACT_GLOBAL')
      .verifyShowsStartDateAs('28 February 2024')
      .clickChangeExpiryDateLink()

    Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL') //
      .clearExpiryDate()
      .enterExpiryDate('15/06/2025')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'CONTACT_GLOBAL')
      .verifyShowExpiryDateAs('15 June 2025')
      .clickChangeCommentsLink()

    Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL') //
      .clearComments()
      .enterComments('Different comments')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'CONTACT_GLOBAL')
      .verifyShowCommentsAs('Different comments')
      .clickContinue()

    Page.verifyOnPage(CreateRestrictionSuccessPage, 'CONTACT_GLOBAL')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/restriction`,
      },
      {
        restrictionType: 'BAN',
        startDate: '2024-02-28',
        expiryDate: '2025-06-15',
        comments: 'Different comments',
        createdBy: 'USER1',
      },
    )
  })

  it('Type and start date are required', () => {
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL')
    enterRestrictionPage.clickContinue()

    enterRestrictionPage.hasFieldInError('type', 'Select the restriction type')
    enterRestrictionPage.hasFieldInError('startDate', 'Enter the start date')
  })

  it('Errors are in field order', () => {
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, 'First Middle Names Last', 'CONTACT_GLOBAL')
    enterRestrictionPage //
      .enterStartDate('foo')
      .enterExpiryDate('bar')
      .enterComments(''.padEnd(500, 'X'))
      .clickContinue()

    enterRestrictionPage.hasFieldInError('type', 'Select the restriction type')
    enterRestrictionPage.hasFieldInError('startDate', 'Start date must be a real date')
    enterRestrictionPage.hasFieldInError('expiryDate', 'Expiry date must be a real date')
    enterRestrictionPage.hasFieldInError('comments', 'Comment must be 240 characters or less')

    enterRestrictionPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(4)
      expect($lis[0]).to.contain('Select the restriction type')
      expect($lis[1]).to.contain('Start date must be a real date')
      expect($lis[2]).to.contain('Expiry date must be a real date')
      expect($lis[3]).to.contain('Comment must be 240 characters or less')
    })
  })
})
