import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import { StubPrisonerContactRestrictionDetails } from '../mockApis/contactsApi'
import EnterRestrictionPage from '../pages/enterRestrictionPage'
import CreateRestrictionCheckYourAnswersPage from '../pages/createRestrictionCheckYourAnswersPage'
import CreateRestrictionSuccessPage from '../pages/createRestrictionSuccessPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import CancelAddRestrictionPage from '../pages/cancelAddRestrictionPage'
import EditRestrictionsPage from '../pages/editRestrictionsPage'

context('Create Prisoner Contact Restriction', () => {
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
  const enterPageTitle = `Add a new relationship restriction`

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubRestrictionTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickRestrictionsTab('0')
      .verifyOnRestrictionsTab()
      .clickLinkTo('Add restrictions', EditRestrictionsPage, 'First Middle Names Last')
      .clickButton('Add relationship restriction')
  })

  it('Can create a new prisoner contact restriction for a contact with minimal fields', () => {
    const created: Partial<StubPrisonerContactRestrictionDetails> = {
      prisonerContactRestrictionId: 99,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreatePrisonerContactRestriction', { prisonerContactId, created })

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .clickButton('Continue')

    Page.verifyOnPage(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT') //
      .verifyShowExpiryDateAs('Not provided')
      .verifyShowCommentsAs('Not provided')
      .clickButton('Confirm and save')

    Page.verifyOnPage(CreateRestrictionSuccessPage, 'PRISONER_CONTACT')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact/${prisonerContactId}/restriction`,
      },
      {
        restrictionType: 'CCTV',
        startDate: '1982-06-15',
        createdBy: 'USER1',
      },
    )
  })

  it('Can create a new prisoner contact for a contact with all fields', () => {
    const created: Partial<StubPrisonerContactRestrictionDetails> = {
      prisonerContactRestrictionId: 99,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreatePrisonerContactRestriction', { prisonerContactId, created })

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .enterExpiryDate('25/12/2025')
      .enterComments('Some comments')
      .clickButton('Continue')

    Page.verifyOnPage(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT') //
      .clickButton('Confirm and save')

    Page.verifyOnPage(CreateRestrictionSuccessPage, 'PRISONER_CONTACT')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact/${prisonerContactId}/restriction`,
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
    const created: Partial<StubPrisonerContactRestrictionDetails> = {
      prisonerContactRestrictionId: 99,
      contactId,
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreatePrisonerContactRestriction', { prisonerContactId, created })

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .enterExpiryDate('25/12/2025')
      .enterComments('Some comments')
      .clickButton('Continue')

    Page.verifyOnPage(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT') //
      .verifyShowsTypeAs('CCTV')
      .verifyShowsStartDateAs('15 June 1982')
      .verifyShowExpiryDateAs('25 December 2025')
      .verifyShowCommentsAs('Some comments')
      .clickChangeTypeLink()

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .selectType('BAN')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT')
      .verifyShowsTypeAs('Banned')
      .clickChangeStartDateLink()

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .clearStartDate()
      .enterStartDate('28/02/2024')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT')
      .verifyShowsStartDateAs('28 February 2024')
      .clickChangeExpiryDateLink()

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .clearExpiryDate()
      .enterExpiryDate('15/06/2025')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT')
      .verifyShowExpiryDateAs('15 June 2025')
      .clickChangeCommentsLink()

    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .clearComments()
      .enterComments('Different comments')
      .continueTo(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT')
      .verifyShowCommentsAs('Different comments')
      .clickButton('Confirm and save')

    Page.verifyOnPage(CreateRestrictionSuccessPage, 'PRISONER_CONTACT')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact/${prisonerContactId}/restriction`,
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
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, enterPageTitle)
    enterRestrictionPage.clickButton('Continue')

    enterRestrictionPage.hasFieldInError('type', 'Select the restriction type')
    enterRestrictionPage.hasFieldInError('startDate', 'Enter the start date')
  })

  it('Errors are in field order', () => {
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, enterPageTitle)
    enterRestrictionPage //
      .enterStartDate('foo')
      .enterExpiryDate('bar')
      .enterComments(''.padEnd(500, 'X'))
      .clickButton('Continue')

    enterRestrictionPage.hasFieldInError('type', 'Select the restriction type')
    enterRestrictionPage.hasFieldInError('startDate', 'Start date must be a real date')
    enterRestrictionPage.hasFieldInError('expiryDate', 'Expiry date must be a real date')
    enterRestrictionPage.hasFieldInError('comments', 'Comment must be 255 characters or less')

    enterRestrictionPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(4)
      expect($lis[0]).to.contain('Select the restriction type')
      expect($lis[1]).to.contain('Start date must be a real date')
      expect($lis[2]).to.contain('Expiry date must be a real date')
      expect($lis[3]).to.contain('Comment must be 255 characters or less')
    })
  })

  it('Expiry date should be after the Start date', () => {
    const enterRestrictionPage = Page.verifyOnPage(EnterRestrictionPage, enterPageTitle)
    enterRestrictionPage //
      .selectType('CCTV')
      .enterStartDate('28/02/2024')
      .enterExpiryDate('27/02/2024')
      .enterComments(''.padEnd(20, 'X'))
      .clickButton('Continue')

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
      .selectType('CCTV')
      .enterStartDate('28/02/2024')
      .clickButtonTo('Continue', CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT')
      .clickLinkTo('Back', EnterRestrictionPage, enterPageTitle)
      .clickLinkTo('Back', EditRestrictionsPage, 'First Middle Names Last')
      .clickLinkTo('Back to contact record', ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancelling asks for confirmation', () => {
    Page.verifyOnPage(EnterRestrictionPage, enterPageTitle) //
      .selectType('CCTV')
      .enterStartDate('15/06/1982')
      .clickButton('Continue')

    Page.verifyOnPage(CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT') //
      .clickLink('Cancel')

    Page.verifyOnPage(CancelAddRestrictionPage) //
      .clickButtonTo('No, return to check answers', CreateRestrictionCheckYourAnswersPage, 'PRISONER_CONTACT')
      .clickLinkTo('Cancel', CancelAddRestrictionPage)
      .clickButtonTo('Yes, cancel', ManageContactDetailsPage, 'First Middle Names Last')
  })
})
