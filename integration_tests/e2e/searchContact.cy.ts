import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import SearchContactPage from '../pages/searchContactPage'
import ListContactsPage from '../pages/listContacts'
import pagedPrisonerAlertsData from '../../server/testutils/testPrisonerAlertsData'

const { prisonerNumber } = TestData.prisoner()

context('Search contact', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubComponentsMeta')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubComponentsMeta')
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.task(
      'stubPrisonerAlertsById',
      pagedPrisonerAlertsData({
        prisonNumber: 'A1234BC',
      }),
    )
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubContactAdvancedSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [TestData.contactSearchResultItem()],
      },
      lastName: '=Lastname',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })

    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith').clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage)
  })

  it(`should not pass validation when lastname and dob is incomplete`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('10')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must include a month and a year')
    })
  })

  it(`should not pass validation when year is invalid`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('99')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Year must include 4 numbers')
    })
  })

  it(`should not pass validation when dob is in the future`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('2090')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must be in the past')
    })
  })

  it(`should not pass validation when dob is not valid`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('29')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('1990')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must be a real date')
    })
  })

  it(`should pass validation when only last name is entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Mason')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/advanced-search.+',
      },
      1,
    )

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/1/1990')
  })

  it(`should pass validation when all the fields are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('14')
    searchContactPage.enterMonth('1')
    searchContactPage.enterYear('1990')
    searchContactPage.clickFilterButton()
    searchContactPage.checkOnPage()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/advanced-search.+',
      },
      2,
    )

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/1/1990')
  })

  it(`should pass validation when day and month starts with 0`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('01')
    searchContactPage.enterMonth('01')
    searchContactPage.enterYear('1990')
    searchContactPage.clickFilterButton()
    searchContactPage.checkOnPage()
  })
})
